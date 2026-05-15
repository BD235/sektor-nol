/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Difficulty, GameState, Planet } from './types';

// ─── Difficulty Presets ─────────────────────────────────────────────

/** Initial stat values and inventory per difficulty tier. */
export const DIFFICULTY_SETTINGS: Record<Difficulty, Partial<GameState>> = {
  RECRUIT: {
    health: 100,
    warmth: 100,
    hunger: 100,
    inventory: ['Ransum (x3)', 'Pemicu Api', 'Peta Digital', 'Pisau Tumpul'],
  },
  SURVIVOR: {
    health: 100,
    warmth: 85,
    hunger: 90,
    inventory: ['Ransum (x1)', 'Pemicu Api', 'Pisau Tumpul'],
  },
  GHOST: {
    health: 80,
    warmth: 60,
    hunger: 70,
    inventory: [],
  },
};

// ─── Planet Configuration ───────────────────────────────────────────

/** Starting location name per planet. */
export const INITIAL_LOCATION: Record<Planet, string> = {
  AETHELGARD: 'Modul Medis Beku',
  IGNIS: 'Landasan Esekusi Basal',
};

/** Opening narrative text per planet when a new game starts. */
export const PLANET_INTRO_TEXT: Record<Planet, string> = {
  AETHELGARD:
    'Hawa dingin membekukan paru-parumu saat kamu terbangun. Kristal nitrogen mulai menumpuk di kaca helm. Kamu harus bergerak atau kamu akan membeku di sini.',
  IGNIS:
    'Cahaya ganda matahari membakar sensor termalmu. Udara di luar mencapai 180°C. Pendingin baju ruang angkasamu berdengung keras, mencoba menyeimbangkan panas ekstrem ini.',
};
