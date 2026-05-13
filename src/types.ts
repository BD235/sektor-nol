/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'RECRUIT' | 'SURVIVOR' | 'GHOST';
export type VisualEffect = 'FROST' | 'HEAT' | 'CRITICAL' | 'NONE';

export interface GameState {
  characterName: string;
  difficulty: Difficulty;
  warmth: number;
  hunger: number;
  health: number;
  inventory: string[];
  day: number;
  location: string;
  planet: 'AETHELGARD' | 'IGNIS';
  visualEffect: VisualEffect;
  signalProgress: number; // 0 to 100
}

export interface GameResponse {
  narrative: string;
  update_status: {
    warmth_delta: number;
    hunger_delta: number;
    health_delta: number;
    items_added: string[];
    items_removed: string[];
    new_location?: string;
    effect?: VisualEffect;
    signal_delta?: number;
    is_win?: boolean;
  };
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, Partial<GameState>> = {
  RECRUIT: {
    health: 100,
    warmth: 100,
    hunger: 100,
    inventory: ["Ransum (x3)", "Pemicu Api", "Peta Digital", "Pisau Tumpul"]
  },
  SURVIVOR: {
    health: 100,
    warmth: 85,
    hunger: 90,
    inventory: ["Ransum (x1)", "Pemicu Api", "Pisau Tumpul"]
  },
  GHOST: {
    health: 80,
    warmth: 60,
    hunger: 70,
    inventory: []
  }
};
