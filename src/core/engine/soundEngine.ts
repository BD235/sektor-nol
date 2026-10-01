/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sound Engine — Manages all audio playback using Howler.js.
 * Provides ambient soundscapes per planet and UI/game sound effects.
 *
 * OPTIMASI: Audio files dimuat secara LAZY — hanya saat pertama kali dibutuhkan,
 * bukan saat app load. Ini menghemat ~500KB bandwidth untuk user yang
 * tidak mengaktifkan audio.
 */

import { Howl } from 'howler';
import type { Planet } from '@/lib/types';

/** Sound source URLs (CDN Mixkit) */
const SOUND_URLS = {
  ambientWind: 'https://assets.mixkit.co/active_storage/sfx/2324/2324-preview.mp3',
  ambientHum: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  ambientHeat: 'https://assets.mixkit.co/active_storage/sfx/2507/2507-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  alert: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3',
  discovery: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  death: 'https://assets.mixkit.co/active_storage/sfx/2533/2533-preview.mp3',
  creature: 'https://assets.mixkit.co/active_storage/sfx/2141/2141-preview.mp3',
  start: 'https://assets.mixkit.co/active_storage/sfx/2550/2550-preview.mp3',
  hunger: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Low rumble/alert for hunger
  win: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3', // Fantasy game success notification
} as const;

/**
 * Sound Engine with lazy-loaded audio.
 *
 * Sebelum: Semua 9 Howl instances dibuat di constructor → 9 HTTP requests saat app load.
 * Sesudah: Howl instances dibuat saat pertama kali `play()` dipanggil → 0 requests sampai audio dibutuhkan.
 */
class SoundEngine {
  /** Cache of loaded Howl instances. Created on first access. */
  private cache = new Map<string, Howl>();

  /** Gets or creates a Howl instance for the given sound key. */
  private getSound(key: keyof typeof SOUND_URLS, options?: Partial<{ loop: boolean; volume: number }>): Howl {
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        new Howl({
          src: [SOUND_URLS[key]],
          loop: options?.loop ?? false,
          volume: options?.volume ?? 0.5,
          preload: true, // Start loading as soon as created
        })
      );
    }
    return this.cache.get(key)!;
  }

  /**
   * Starts the ambient soundscape for the given planet.
   * Aethelgard plays wind + hum, Ignis plays heat rumble + hum.
   */
  public startAmbience(planet: Planet = 'AETHELGARD'): void {
    const wind = this.getSound('ambientWind', { loop: true, volume: 0.3 });
    const heat = this.getSound('ambientHeat', { loop: true, volume: 0.25 });
    const hum = this.getSound('ambientHum', { loop: true, volume: 0.15 });

    if (planet === 'AETHELGARD') {
      if (!wind.playing()) wind.play();
      heat.stop();
    } else {
      if (!heat.playing()) heat.play();
      wind.stop();
    }
    if (!hum.playing()) hum.play();
  }

  /** Stops all ambient sounds. */
  public stopAmbience(): void {
    this.cache.get('ambientWind')?.stop();
    this.cache.get('ambientHum')?.stop();
    this.cache.get('ambientHeat')?.stop();
  }

  /** Plays a short UI click sound. */
  public playClick(): void {
    this.getSound('click', { volume: 0.5 }).play();
  }

  /** Plays the game start fanfare. */
  public playStart(): void {
    this.getSound('start', { volume: 0.6 }).play();
  }

  /** Plays a warning alert sound for critical stat changes. */
  public playAlert(): void {
    this.getSound('alert', { volume: 0.4 }).play();
  }

  /** Plays a discovery/pickup chime for new items. */
  public playDiscovery(): void {
    this.getSound('discovery', { volume: 0.5 }).play();
  }

  /** Plays the death sequence sound. */
  public playDeath(): void {
    this.getSound('death', { volume: 0.6 }).play();
  }

  /** Plays an ambient creature noise. */
  public playCreature(): void {
    this.getSound('creature', { volume: 0.2 }).play();
  }

  /** Plays a warning sound when hunger reaches critical levels. */
  public playHunger(): void {
    this.getSound('hunger', { volume: 0.5 }).play();
  }

  /** Plays the victory/win fanfare. */
  public playWin(): void {
    this.getSound('win', { volume: 0.7 }).play();
  }
}

/** Singleton sound engine instance. */
export const soundEngine = new SoundEngine();
