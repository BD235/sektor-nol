import { useState, useCallback } from 'react';
import { soundEngine } from '@/core';
import type { Planet } from '@/lib/types';

interface UseAudioReturn {
  isAudioEnabled: boolean;
  handleToggleAudio: (planet?: Planet) => void;
}

/**
 * Manages audio state and ambient sound lifecycle.
 * The toggle starts/stops planet-specific ambience sounds.
 */
export function useAudio(): UseAudioReturn {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const handleToggleAudio = useCallback((planet?: Planet) => {
    setIsAudioEnabled((prev) => {
      if (prev) {
        soundEngine.stopAmbience();
        return false;
      } else {
        if (planet) soundEngine.startAmbience(planet);
        soundEngine.playClick();
        return true;
      }
    });
  }, []);

  return { isAudioEnabled, handleToggleAudio };
}
