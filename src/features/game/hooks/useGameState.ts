import React, { useState, useCallback } from 'react';
import { soundEngine } from '@/core';
import { DIFFICULTY_SETTINGS, INITIAL_LOCATION, PLANET_INTRO_TEXT } from '@/lib/constants';
import type { GameState, GameScreen, Difficulty, Planet, LogEntry } from '@/lib/types';
import { useAudio } from './useAudio';
import { useGameSave } from './useGameSave';
import { useGameAction } from './useGameAction';

interface UseGameStateReturn {
  // Screen routing
  gameScreen: GameScreen;
  setGameScreen: React.Dispatch<React.SetStateAction<GameScreen>>;

  // Game state
  state: GameState | null;

  // Game actions
  handleStartGame: (characterName: string, difficulty: Difficulty, planet: Planet) => void;
  handleExitToMenu: () => void;
  handleLoadGame: () => Promise<void>;

  // Audio
  isAudioEnabled: boolean;
  handleToggleAudio: () => void;

  // Save
  isSaving: boolean;

  // Game action (AI loop)
  logs: LogEntry[];
  input: string;
  isProcessing: boolean;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Orchestrator hook — composes useAudio, useGameSave, and useGameAction
 * into a single interface for the game feature.
 *
 * Manages the game screen state machine and coordinates
 * transitions between START → PLAYING → WON / LOADING states.
 */
export function useGameState(initialScreen: GameScreen = 'START'): UseGameStateReturn {
  const [gameScreen, setGameScreen] = useState<GameScreen>(initialScreen);
  const [state, setState] = useState<GameState | null>(null);

  // Sub-hooks
  const { isAudioEnabled, handleToggleAudio: rawToggleAudio } = useAudio();
  const { isSaving, handleSaveGame, handleLoadGame: rawLoadGame } = useGameSave();

  const handleWin = useCallback(() => {
    setGameScreen('WON');
  }, []);

  const handleSave = useCallback(
    (data: GameState) => {
      handleSaveGame(data);
    },
    [handleSaveGame]
  );

  const { logs, input, isProcessing, setInput, setLogs, handleSubmit } = useGameAction(
    state,
    setState,
    isAudioEnabled,
    handleWin,
    handleSave
  );

  // ─── Audio (planet-aware toggle) ────────────────────────────────

  const handleToggleAudio = useCallback(() => {
    rawToggleAudio(state?.planet);
  }, [rawToggleAudio, state?.planet]);

  // ─── Game Lifecycle ─────────────────────────────────────────────

  const handleStartGame = useCallback(
    (characterName: string, difficulty: Difficulty, planet: Planet) => {
      const settings = DIFFICULTY_SETTINGS[difficulty];
      const initialState: GameState = {
        characterName: characterName || 'EXPLORER',
        difficulty,
        planet,
        health: settings.health || 100,
        warmth: settings.warmth || 100,
        hunger: settings.hunger || 100,
        inventory: [...(settings.inventory || [])],
        day: 1,
        location: INITIAL_LOCATION[planet],
        visualEffect: 'NONE',
        signalProgress: 0,
      };

      setState(initialState);
      setGameScreen('PLAYING');
      setLogs([
        {
          id: `sys-init-${Date.now()}`,
          type: 'system',
          text: `--- SISTEM DIINISIALISASI: ${planet} | ${difficulty} ---`,
        },
        {
          id: `narr-intro-${Date.now()}`,
          type: 'narrative',
          text: PLANET_INTRO_TEXT[planet],
        },
      ]);

      if (isAudioEnabled) {
        soundEngine.playDiscovery();
        soundEngine.startAmbience(planet);
      }
    },
    [isAudioEnabled, setLogs]
  );

  const handleExitToMenu = useCallback(() => {
    if (isAudioEnabled) {
      soundEngine.playClick();
      soundEngine.stopAmbience();
    }
    setGameScreen('START');
    setState(null);
    setLogs([]);
  }, [isAudioEnabled, setLogs]);

  const handleLoadGame = useCallback(async () => {
    setGameScreen('LOADING');
    const loadedState = await rawLoadGame();
    if (loadedState) {
      setState(loadedState);
      setGameScreen('PLAYING');
      setLogs([
        {
          id: `sys-recover-${Date.now()}`,
          type: 'system',
          text: `--- RECOVERY DATA: ${loadedState.planet} | ${loadedState.difficulty} ---`,
        },
        {
          id: `narr-recover-${Date.now()}`,
          type: 'narrative',
          text: `Sinkronisasi selesai. Kamu berada di ${loadedState.location}.`,
        },
      ]);
      if (isAudioEnabled) {
        soundEngine.playDiscovery();
        soundEngine.startAmbience(loadedState.planet);
      }
    } else {
      setLogs((prev) => [
        ...prev,
        { id: `sys-err-${Date.now()}`, type: 'system', text: '[ERROR: DATA TIDAK DITEMUKAN]' },
      ]);
      setGameScreen('START');
    }
  }, [rawLoadGame, isAudioEnabled, setLogs]);

  return {
    gameScreen,
    setGameScreen,
    state,
    handleStartGame,
    handleExitToMenu,
    handleLoadGame,
    isAudioEnabled,
    handleToggleAudio,
    isSaving,
    logs,
    input,
    isProcessing,
    setInput,
    setLogs,
    handleSubmit,
  };
}
