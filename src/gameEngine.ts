import { GoogleGenAI, Type } from "@google/genai";
import { GameResponse, GameState } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const schema = {
  description: "Survival game response",
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "Atmospheric narrative describing the result of the action.",
    },
    update_status: {
      type: Type.OBJECT,
      properties: {
        warmth_delta: { type: Type.NUMBER },
        hunger_delta: { type: Type.NUMBER },
        health_delta: { type: Type.NUMBER },
        items_added: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        items_removed: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        new_location: { type: Type.STRING },
        effect: { 
          type: Type.STRING, 
          enum: ["FROST", "HEAT", "CRITICAL", "NONE"],
          description: "Visual effect to trigger based on environment or status." 
        },
      },
      required: ["warmth_delta", "hunger_delta", "health_delta", "items_added", "items_removed"],
    },
  },
  required: ["narrative", "update_status"],
};

export async function* streamGameAction(action: string, currentState: GameState) {
  const prompt = `
    MASTER LORE REFERENCE:
    - PLANET AETHELGARD-7: Frozen ocean world. Atmospheric nitrogen crystals freeze lungs.
    - PLANET IGNIS PRIME: Obsidian core exposed to dual suns. Surface is 180°C.

    CURRENT STATUS:
    - Character Name: ${currentState.characterName}
    - Difficulty: ${currentState.difficulty}, Planet: ${currentState.planet}, Location: ${currentState.location}
    - Stats: Warmth ${currentState.warmth}%, Hunger ${currentState.hunger}%, Health ${currentState.health}%, Signal: ${currentState.signalProgress}%
    - Inventory: [${currentState.inventory.join(", ")}]
    
    PLAYER ACTION: "${action}"
    
    INSTRUCTIONS:
    1. Tulislah narasi atmosferik dalam Bahasa Indonesia yang singkat dan tegang.
    2. Pemain bisa meningkatkan Signal (0-100%) dengan mencari data, memperbaiki transmiter, atau mencapai tempat tinggi.
    3. Setelah narasi, tambahkan baris baru dengan format JSON di dalam tag [UPDATE]...[/UPDATE].
    4. JSON harus berisi: warmth_delta, hunger_delta, health_delta, items_added (array), items_removed (array), new_location (optional), effect (FROST|HEAT|CRITICAL|NONE), signal_delta (angka), is_win (boolean).
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are the Game Engine for "Sektor Nol".
          Output: [Narrative Text] \n [UPDATE]{"warmth_delta": 0, "signal_delta": 5, "is_win": false, ...}[/UPDATE]
          Win Condition: Signal must reach 100% through exploration/actions, then the player must successfully "Escape" or "Signal for Rescue".
          If is_win is true, describe the successful evacuation in the narrative.
          Keep narration punchy and high-stakes.`,
      },
    });

    let fullText = "";
    let narrativeYielded = "";

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        
        // Find if we've reached the update tag
        const updateIndex = fullText.indexOf("[UPDATE]");
        
        if (updateIndex === -1) {
          // No update tag yet, yield all new text
          const newText = fullText.substring(narrativeYielded.length);
          if (newText) {
            yield { type: 'text', text: newText };
            narrativeYielded = fullText;
          }
        } else {
          // We hit the update tag. Yield only what's before it, if not yielded yet.
          const finalNarrative = fullText.substring(0, updateIndex);
          const newText = finalNarrative.substring(narrativeYielded.length);
          if (newText) {
            yield { type: 'text', text: newText };
            narrativeYielded = finalNarrative;
          }
        }
      }
    }

    // After stream ends, extract JSON
    const updateMatch = fullText.match(/\[UPDATE\]([\s\S]*?)\[\/UPDATE\]/);
    if (updateMatch) {
      const jsonStr = updateMatch[1].trim();
      const result = JSON.parse(jsonStr);
      yield { type: 'data', data: result };
    }
  } catch (error) {
    console.error("AI Streaming Error:", error);
    yield { type: 'text', text: "Terjadi gangguan pada transmisi..." };
  }
}
