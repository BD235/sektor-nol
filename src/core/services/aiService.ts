/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI Service — Gemini streaming integration for the Sektor Nol game engine.
 * Streams narrative text in real-time, then yields parsed state updates.
 */

import { GoogleGenAI } from '@google/genai';
import type { GameState, StreamChunk, StatusUpdate } from '@/lib/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/** System instruction that defines the AI's role as the game engine. */
const SYSTEM_INSTRUCTION = `You are the Game Engine for "Sektor Nol".
Output: [Narrative Text] \\n [UPDATE]{"warmth_delta": 0, "signal_delta": 5, "is_win": false, ...}[/UPDATE]
Win Condition: Signal must reach 100% through exploration/actions, then the player must successfully "Escape" or "Signal for Rescue".
If is_win is true, describe the successful evacuation in the narrative.
Keep narration punchy and high-stakes.`;

/**
 * Builds the full prompt sent to Gemini, including world lore, current state, and player action.
 *
 * @param action - The player's text input describing their action
 * @param state - Current game state snapshot
 * @returns Formatted prompt string
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
    2. Pemain bisa meningkatkan Signal (0-100%) dengan mencari data, memperbaiki transmiter, atau mencapai tempat tinggi.
    3. Setelah narasi, tambahkan baris baru dengan format JSON di dalam tag [UPDATE]...[/UPDATE].
    4. JSON harus berisi: warmth_delta, hunger_delta, health_delta, items_added (array), items_removed (array), new_location (optional), effect (FROST|HEAT|CRITICAL|NONE), signal_delta (angka), is_win (boolean).
  `;
}

/**
 * Safely parses the JSON from an [UPDATE]...[/UPDATE] block.
 * Returns a fallback no-op update if parsing fails.
 *
 * @param jsonStr - Raw JSON string extracted from the AI response
 * @returns Parsed StatusUpdate with safe defaults
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

/**
 * Streams a game action through the Gemini AI and yields results incrementally.
 *
 * The function yields two types of chunks:
 * 1. `StreamTextChunk` — narrative text fragments as they arrive (for real-time display)
 * 2. `StreamDataChunk` — the parsed state update after the full response is received
 *
 * The AI response format is: `[narrative text]\n[UPDATE]{json}[/UPDATE]`
 *
 * @param action - Player's action text
 * @param currentState - Current game state for context
 * @yields StreamChunk — either narrative text or parsed game state update
 *
 * @example
 * ```ts
 * for await (const chunk of streamGameAction('cari kayu', gameState)) {
 *   if (chunk.type === 'text') updateNarrative(chunk.text);
 *   if (chunk.type === 'data') applyStateUpdate(chunk.data);
 * }
 * ```
 */
export async function* streamGameAction(
  action: string,
  currentState: GameState
): AsyncGenerator<StreamChunk> {
  const prompt = buildPrompt(action, currentState);

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
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

        // [KOMENTAR LOGIKA STREAMING]
        // Sistem membaca respons AI sepotong demi sepotong (chunking).
        // Teks sebelum tag [UPDATE] dianggap sebagai narasi cerita dan langsung di-render ke UI.
        // Teks di dalam tag [UPDATE]...[/UPDATE] ditahan, dikumpulkan, dan tidak ditampilkan ke pemain.
        const updateIndex = fullText.indexOf('[UPDATE]');

        if (updateIndex === -1) {
          // Jika belum ada tag [UPDATE], berarti ini masih murni teks cerita. Tampilkan ke UI.
          const newText = fullText.substring(narrativeYielded.length);
          if (newText) {
            yield { type: 'text', text: newText };
            narrativeYielded = fullText;
          }
        } else {
          // Jika tag [UPDATE] ditemukan, kita berhenti menampilkan teks ke UI.
          // Sisa respons AI setelah titik ini adalah data JSON untuk update state (darah, lokasi, dll).
          const finalNarrative = fullText.substring(0, updateIndex);
          const newText = finalNarrative.substring(narrativeYielded.length);
          if (newText) {
            yield { type: 'text', text: newText };
            narrativeYielded = finalNarrative;
          }
        }
      }
    }

    // After stream ends, extract and parse the JSON update
    const updateMatch = fullText.match(/\[UPDATE\]([\s\S]*?)\[\/UPDATE\]/);
    if (updateMatch) {
      const result = parseUpdateJson(updateMatch[1].trim());
      yield { type: 'data', data: result };
    }
  } catch (error) {
    console.error('AI Streaming Error:', error);
    yield { type: 'text', text: 'Terjadi gangguan pada transmisi...' };
  }
}
