import React, { useState, useCallback, useRef } from 'react';
import { streamGameAction } from '@/core';
import { soundEngine } from '@/core';
import { auth } from '@/lib/firebase';
import type { GameState, LogEntry, StatusUpdate } from '@/lib/types';

interface UseGameActionReturn {
  logs: LogEntry[];
  input: string;
  isProcessing: boolean;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/** Generates a unique ID for log entries (avoids index-based React keys). */
let logIdCounter = 0;
function createLogId(): string {
  return `log-${Date.now()}-${++logIdCounter}`;
}

/**
 * Manages the AI action stream, console logs, and user input.
 *
 * Responsible for:
 * - Streaming player actions through Gemini AI
 * - Updating narrative logs in real-time
 * - Applying state deltas from AI response
 * - Triggering contextual sound effects
 *
 * @param state - Current game state (read-only, for sending to AI)
 * @param setState - Game state setter for applying AI updates
 * @param isAudioEnabled - Whether sound effects should play
 * @param onWin - Callback when the AI declares a win condition
 * @param onSave - Callback to persist state after each action
 */
export function useGameAction(
  state: GameState | null,
  setState: React.Dispatch<React.SetStateAction<GameState | null>>,
  isAudioEnabled: boolean,
  onWin: () => void,
  onSave: (data: GameState) => void
): UseGameActionReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const isAudioRef = useRef(isAudioEnabled);
  isAudioRef.current = isAudioEnabled;

  /** Rate limiting: minimum 2 seconds between AI requests to prevent quota abuse. */
  const COOLDOWN_MS = 2000;
  const lastSubmitRef = useRef(0);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (!input.trim() || isProcessing || !state || state.health <= 0) return;

      // Rate limit: reject if submitted within cooldown period
      if (now - lastSubmitRef.current < COOLDOWN_MS) {
        setLogs((prev) => [
          ...prev,
          { id: createLogId(), type: 'system', text: '[SISTEM: Tunggu sebentar sebelum aksi berikutnya...]' },
        ]);
        return;
      }
      lastSubmitRef.current = now;

      if (isAudioRef.current) soundEngine.playClick();

      const userAction = input.trim();
      setInput('');
      setIsProcessing(true);
      setLogs((prev) => [...prev, { id: createLogId(), type: 'action', text: userAction }]);

      // Prepare empty narrative entry for streaming
      const narrativeId = createLogId();
      setLogs((prev) => [...prev, { id: narrativeId, type: 'narrative', text: '' }]);
      let narrativeText = '';

      try {
        const stream = streamGameAction(userAction, state);

        for await (const chunk of stream) {
          if (chunk.type === 'text') {
            narrativeText += chunk.text;
            const currentText = narrativeText;
            setLogs((prev) => {
              const newLogs = [...prev];
              const lastIdx = newLogs.length - 1;
              if (lastIdx >= 0) {
                newLogs[lastIdx] = { ...newLogs[lastIdx], text: currentText };
              }
              return newLogs;
            });
          } else if (chunk.type === 'data') {
            handleStateUpdate(chunk.data);
          }
        }
      } catch (error) {
        console.error('Game stream error:', error);
        setLogs((prev) => [
          ...prev,
          { id: createLogId(), type: 'system', text: '[ERROR: GANGGUAN KOMUNIKASI SATELIT]' },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [input, isProcessing, state] // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Applies AI-generated delta updates to game state and triggers side effects. */
  function handleStateUpdate(updates: StatusUpdate): void {
    setState((prev) => {
      if (!prev) return null;
      const nextWarmth = Math.min(100, Math.max(0, prev.warmth + (updates.warmth_delta || 0)));
      const nextHealth = Math.min(100, Math.max(0, prev.health + (updates.health_delta || 0)));
      
      let computedEffect = updates.effect || 'NONE';
      // Force override frost effects based on stats since AI might return old 'FROST' string
      if (computedEffect === 'NONE' || (computedEffect as string) === 'FROST' || (computedEffect as string).startsWith('FROST')) {
        if (nextHealth < 25) computedEffect = 'CRITICAL';
        else if (nextWarmth <= 25) computedEffect = 'FROST_EXTREME';
        else if (nextWarmth <= 50) computedEffect = 'FROST_MEDIUM';
        else if (nextWarmth <= 75) computedEffect = 'FROST_NORMAL';
        else computedEffect = 'NONE';
      }

      const nextState: GameState = {
        ...prev,
        warmth: Math.min(100, Math.max(0, prev.warmth + updates.warmth_delta)),
        hunger: Math.min(100, Math.max(0, prev.hunger + updates.hunger_delta)),
        health: Math.min(100, Math.max(0, prev.health + updates.health_delta)),
        signalProgress: Math.min(
          100,
          Math.max(0, prev.signalProgress + (updates.signal_delta || 0))
        ),
        inventory: Array.from(
          new Set([
            ...prev.inventory.filter((item) => !updates.items_removed.includes(item)),
            ...updates.items_added,
          ])
        ),
        location: updates.new_location || prev.location,
        day: prev.day + 0.1,
        visualEffect: computedEffect,
      };

      if (updates.is_win) {
        onWin();
      }

      if (isAudioRef.current) {
        if (updates.items_added?.length > 0) soundEngine.playDiscovery();
        if (updates.health_delta < -10) soundEngine.playAlert();
        if (Math.random() < 0.15) soundEngine.playCreature();
        if (nextState.health <= 0 && prev.health > 0) soundEngine.playDeath();
        
        // Hunger threshold sound logic
        if ((nextState.hunger <= 50 && prev.hunger > 50) || (nextState.hunger <= 25 && prev.hunger > 25)) {
          soundEngine.playHunger();
        }
      }

      if (auth.currentUser) {
        onSave(nextState);
      }

      return nextState;
    });
  }

  return { logs, input, isProcessing, setInput, setLogs, handleSubmit };
}
