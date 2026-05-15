import React from 'react';
import type { User } from 'firebase/auth';
import type { GameState, LogEntry } from '@/lib/types';
import VisualOverlays from '../components/VisualOverlays';
import StatusPanel from '../components/StatusPanel';
import GameConsole from '../components/GameConsole';
import DeathPanel from '../components/DeathPanel';

interface GameScreenProps {
  state: GameState;
  user: User | null;
  logs: LogEntry[];
  input: string;
  isProcessing: boolean;
  isSaving: boolean;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onExitToMenu: () => void;
  onLogout: () => void;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** Main gameplay screen — composes StatusPanel, GameConsole, and VisualOverlays. */
export default function GameScreen({
  state,
  user,
  logs,
  input,
  isProcessing,
  isSaving,
  isAudioEnabled,
  onToggleAudio,
  onExitToMenu,
  onLogout,
  onInputChange,
  onSubmit,
}: GameScreenProps) {
  return (
    <div className="flex flex-col h-[100dvh] p-3 md:p-8 md:flex-row gap-4 md:gap-6 relative overflow-hidden">
      <VisualOverlays effect={state.visualEffect} />

      <StatusPanel
        state={state}
        user={user}
        isSaving={isSaving}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={onToggleAudio}
        onExitToMenu={onExitToMenu}
        onLogout={onLogout}
      />

      <GameConsole
        logs={logs}
        input={input}
        isProcessing={isProcessing}
        isTerminalOffline={state.health <= 0}
        planetName={state.planet}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />

      {state.health <= 0 && <DeathPanel />}
    </div>
  );
}
