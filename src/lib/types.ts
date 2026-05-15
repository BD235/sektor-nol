/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';

// ─── Game Domain Types ──────────────────────────────────────────────

/** Difficulty tiers affecting initial stats and inventory. */
export type Difficulty = 'RECRUIT' | 'SURVIVOR' | 'GHOST';

/** Available planet environments. */
export type Planet = 'AETHELGARD' | 'IGNIS';

/** Visual overlays triggered by environmental or health conditions. */
export type VisualEffect = 'FROST_NORMAL' | 'FROST_MEDIUM' | 'FROST_EXTREME' | 'HEAT' | 'CRITICAL' | 'NONE';

/** Screens managed by the application state machine. */
export type GameScreen = 'LOGIN' | 'START' | 'PLAYING' | 'LOADING' | 'WON';

// ─── Game State ─────────────────────────────────────────────────────

/** Core game state persisted to Firestore and managed in-memory. */
export interface GameState {
  characterName: string;
  difficulty: Difficulty;
  planet: Planet;
  warmth: number;
  hunger: number;
  health: number;
  inventory: string[];
  day: number;
  location: string;
  visualEffect: VisualEffect;
  /** Signal progress from 0 to 100. Reaching 100 enables win condition. */
  signalProgress: number;
}

// ─── AI Response Types ──────────────────────────────────────────────

/** Delta updates returned by the AI game engine per action. */
export interface StatusUpdate {
  warmth_delta: number;
  hunger_delta: number;
  health_delta: number;
  items_added: string[];
  items_removed: string[];
  new_location?: string;
  effect?: VisualEffect;
  signal_delta?: number;
  is_win?: boolean;
}

/** Full structured response from the Gemini AI. */
export interface GameResponse {
  narrative: string;
  update_status: StatusUpdate;
}

/** Stream chunk: narrative text fragment. */
export interface StreamTextChunk {
  type: 'text';
  text: string;
}

/** Stream chunk: parsed game state update. */
export interface StreamDataChunk {
  type: 'data';
  data: StatusUpdate;
}

/** Union type for all possible stream chunks. */
export type StreamChunk = StreamTextChunk | StreamDataChunk;

// ─── UI Types ───────────────────────────────────────────────────────

/** A single entry in the game console log. */
export interface LogEntry {
  id: string;
  type: 'action' | 'narrative' | 'system';
  text: string;
}

/** Props for the unified selection button (planet/difficulty). */
export interface SelectionButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  name: string;
  description: string;
  onInfoClick?: () => void;
}

/** Props for the status bar item. */
export interface StatusItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  isCritical: boolean;
  color?: string;
}

/** Props for LoginScreen. */
export interface LoginScreenProps {
  onLogin: () => void;
  onSkip: () => void;
  authError: string | null;
}

/** Props for StartScreen. */
export interface StartScreenProps {
  user: import('firebase/auth').User | null;
  onStart: (characterName: string, difficulty: Difficulty, planet: Planet) => void;
  onLoad: () => void;
  onLogout: () => void;
  handleToggleAudio: () => void;
  isAudioEnabled: boolean;
}
