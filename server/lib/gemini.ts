/**
 * Gemini AI Service — Server-side streaming integration for Sektor Nol.
 * Migrated from src/core/services/aiService.ts to keep API key secure.
 */

import { GoogleGenAI } from '@google/genai';

// ─── Types (redefined here to avoid importing from frontend src/) ──

interface GameState {
  characterName: string;
  difficulty: string;
  planet: string;
  warmth: number;
  hunger: number;
  health: number;
  inventory: string[];
  day: number;
  location: string;
  signalProgress: number;
}

interface StatusUpdate {
  warmth_delta: number;
  hunger_delta: number;
  health_delta: number;
  items_added: string[];
  items_removed: string[];
  new_location?: string;
  effect?: string;
  signal_delta: number;
  is_win: boolean;
}

export type StreamChunk =
  | { type: 'text'; text: string }
  | { type: 'data'; data: StatusUpdate };

// ─── Gemini Client ─────────────────────────────────────────────────

// Array to hold multiple AI instances for Round-Robin
let aiClients: GoogleGenAI[] = [];
let currentClientIndex = 0;

function getAIs(): GoogleGenAI[] {
  if (aiClients.length === 0) {
    const keys: string[] = [];

    // Coba ambil dari multiple keys jika ada (misal: GEMINI_API_KEY_1, GEMINI_API_KEY_2)
    if (process.env.GEMINI_API_KEY_1) keys.push(process.env.GEMINI_API_KEY_1);
    if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2);

    // Jika tidak ada key ganda, gunakan key standar
    if (keys.length === 0 && process.env.GEMINI_API_KEY) {
      keys.push(process.env.GEMINI_API_KEY);
    }

    if (keys.length === 0) {
      throw new Error(
        'GEMINI_API_KEY is not set. ' +
        'Local: create .env with GEMINI_API_KEY_1 and GEMINI_API_KEY_2, or GEMINI_API_KEY. ' +
        'Cloud Run: set via --set-env-vars.'
      );
    }

    // Inisialisasi client untuk setiap key yang ditemukan
    aiClients = keys.map(apiKey => new GoogleGenAI({ apiKey }));
  }
  return aiClients;
}

/** System instruction that defines the AI's role as the game engine. */
const SYSTEM_INSTRUCTION = `You are the Game Engine for "Sektor Nol".
Output: [Narrative Text] \\n [UPDATE]{"warmth_delta": 0, "signal_delta": 5, "is_win": false, ...}[/UPDATE]
Win Condition: Signal must reach 100% through exploration/actions, then the player must successfully "Escape" or "Signal for Rescue".
If is_win is true, describe the successful evacuation in the narrative.
Keep narration punchy and high-stakes.`;

// ─── Prompt Builder ────────────────────────────────────────────────

/**
 * Builds the full prompt sent to Gemini, including world lore, current state, and player action.
 */
function buildPrompt(action: string, state: GameState): string {
  return `
    MASTER LORE REFERENCE:
    - PLANET AETHELGARD-7: Frozen ocean world. Atmospheric nitrogen crystals freeze lungs.
    - PLANET IGNIS PRIME: Obsidian core exposed to dual suns. Surface is 180°C.

    CURRENT STATUS:
    - Character Name: ${state.characterName}
    - Difficulty: ${state.difficulty}, Planet: ${state.planet}, Location: ${state.location}
    - Stats: Warmth ${state.warmth}%, Hunger ${state.hunger}%, Health ${state.health}%, Signal: ${state.signalProgress}%
    - Inventory: [${state.inventory.join(', ')}]
    
    PLAYER ACTION: "${action}"
    
    INSTRUCTIONS:
    1. Tulislah narasi atmosferik dalam Bahasa Indonesia yang singkat dan tegang.
    2. ATURAN SURVIVAL KETAT: Setiap aksi (terutama mencari sinyal/eksplorasi) memakan waktu dan energi! Selalu berikan penalti negatif pada warmth_delta dan hunger_delta.
    3. TINGKAT KESULITAN (${state.difficulty}):
       - Jika MUDAH: Penalti standar (-15 s/d -20 per aksi).
       - Jika NORMAL/SULIT: Penalti sangat berat (-20 s/d -35 per aksi).
       - Jika pemain terus fokus mencari sinyal tanpa makan/menghangatkan diri, berikan penalti health_delta yang fatal! Pemain HARUS dipaksa bertahan hidup, bukan sekadar mencari sinyal.
    4. Setelah narasi, tambahkan baris baru dengan format JSON di dalam tag [UPDATE]...[/UPDATE].
    5. JSON harus berisi: warmth_delta, hunger_delta, health_delta, items_added (array), items_removed (array), new_location (optional), effect (FROST|HEAT|CRITICAL|NONE), signal_delta (angka), is_win (boolean).
  `;
}

// ─── JSON Parser ───────────────────────────────────────────────────

/**
 * Safely parses the JSON from an [UPDATE]...[/UPDATE] block.
 * Returns a fallback no-op update if parsing fails.
 */
function parseUpdateJson(jsonStr: string): StatusUpdate {
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      warmth_delta: parsed.warmth_delta ?? 0,
      hunger_delta: parsed.hunger_delta ?? 0,
      health_delta: parsed.health_delta ?? 0,
      items_added: Array.isArray(parsed.items_added) ? parsed.items_added : [],
      items_removed: Array.isArray(parsed.items_removed) ? parsed.items_removed : [],
      new_location: parsed.new_location,
      effect: parsed.effect,
      signal_delta: parsed.signal_delta ?? 0,
      is_win: parsed.is_win ?? false,
    };
  } catch (error) {
    console.error('Failed to parse AI update JSON:', error, jsonStr);
    return {
      warmth_delta: 0,
      hunger_delta: 0,
      health_delta: 0,
      items_added: [],
      items_removed: [],
      signal_delta: 0,
      is_win: false,
    };
  }
}

// ─── Streaming Generator ───────────────────────────────────────────

/**
 * Streams a game action through Gemini AI and yields results incrementally.
 *
 * Yields two types of chunks:
 * 1. `StreamTextChunk` — narrative text fragments as they arrive
 * 2. `StreamDataChunk` — the parsed state update after the full response
 */
export async function* streamGameAction(
  action: string,
  currentState: GameState
): AsyncGenerator<StreamChunk> {
  const prompt = buildPrompt(action, currentState);

  const clients = getAIs();

  // Tentukan Client API untuk percobaan pertama berdasarkan urutan Round-Robin
  const startClientIndex = currentClientIndex;
  // Geser giliran untuk request berikutnya
  currentClientIndex = (currentClientIndex + 1) % clients.length;

  // Daftar model berdasarkan prioritas (terbaik ke paling stabil/gratis)
  const models = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: any;

  // Loop 1: Coba setiap API Key / Client (Fallback API Key)
  for (let c = 0; c < clients.length; c++) {
    const clientIndex = (startClientIndex + c) % clients.length;
    const client = clients[clientIndex];

    // Loop 2: Coba setiap Model AI (Fallback Model)
    for (const model of models) {
      try {
        const responseStream = await client.models.generateContentStream({
          model: model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });

        let fullText = '';
        let narrativeYielded = '';

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            fullText += text;

            // Teks sebelum tag [UPDATE] adalah narasi cerita → tampilkan ke client.
            const updateIndex = fullText.indexOf('[UPDATE]');

            if (updateIndex === -1) {
              const newText = fullText.substring(narrativeYielded.length);
              if (newText) {
                yield { type: 'text', text: newText };
                narrativeYielded = fullText;
              }
            } else {
              const finalNarrative = fullText.substring(0, updateIndex);
              const newText = finalNarrative.substring(narrativeYielded.length);
              if (newText) {
                yield { type: 'text', text: newText };
                narrativeYielded = finalNarrative;
              }
            }
          }
        }

        // Parsing JSON update setelah stream selesai
        const updateMatch = fullText.match(/\[UPDATE\]([\s\S]*?)\[\/UPDATE\]/);
        if (updateMatch) {
          const result = parseUpdateJson(updateMatch[1].trim());
          yield { type: 'data', data: result };
        }

        // Jika berhasil sampai sini tanpa error, hentikan stream (berhasil)
        return;
      } catch (error: any) {
        console.warn(`[AI Fallback] Key Index ${clientIndex}, Model ${model} gagal:`, error?.message || 'Error tidak diketahui');
        lastError = error;

        // Terjadi error (misal 429 Rate Limit). 
        // Lanjutkan ke iterasi model berikutnya...
        // Jika model habis, akan lanjut ke Key/Client berikutnya.
      }
    }
  }

  // Jika semua model gagal:
  console.error('AI Streaming Error (Semua model habis):', lastError);
  yield { type: 'text', text: 'Sistem satelit overload. Seluruh jalur komunikasi AI terputus. Silakan coba lagi.' };
}
