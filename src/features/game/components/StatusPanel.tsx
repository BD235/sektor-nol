import React from 'react';
import { motion } from 'motion/react';
import {
  Thermometer,
  Utensils,
  Heart,
  Radio,
  Terminal as TerminalIcon,
  Volume2,
  VolumeX,
  LogOut,
  CloudUpload,
} from 'lucide-react';
import type { GameState } from '@/lib/types';
import type { User } from 'firebase/auth';
import StatusItem from './StatusItem';
import InventoryPanel from './InventoryPanel';

interface StatusPanelProps {
  state: GameState;
  user: User | null;
  isSaving: boolean;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onExitToMenu: () => void;
  onLogout: () => void;
}

/** Sidebar panel containing player stats, inventory, location info, and controls. */
export default function StatusPanel({
  state,
  user,
  isSaving,
  isAudioEnabled,
  onToggleAudio,
  onExitToMenu,
  onLogout,
}: StatusPanelProps) {
  return (
    <motion.aside
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full md:w-80 flex flex-col gap-4 z-10"
    >
      <div className="border-2 border-emerald-900/50 bg-emerald-950/20 p-4 rounded-lg backdrop-blur-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b border-emerald-900/50 pb-2">
          <div className="flex flex-col">
            <h1 className="text-xl font-black flex items-center gap-2">
              <TerminalIcon className="w-5 h-5 text-emerald-500" /> SEKTOR NOL
            </h1>
            <div className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              ID: {state.characterName.toUpperCase()}
            </div>
          </div>
          <div className="flex gap-2">
            {isSaving && (
              <div className="p-1.5 text-cyan-500 animate-pulse" title="Saving...">
                <CloudUpload className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={onToggleAudio}
              className={`p-1.5 rounded-full transition-colors ${isAudioEnabled
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-emerald-900 hover:text-emerald-700'
                }`}
              title={isAudioEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
            >
              {isAudioEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onExitToMenu}
              className="p-1.5 rounded-full text-emerald-900 hover:text-red-500 hover:bg-red-500/10 transition-all"
              title="Keluar ke Menu Utama"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stat Bars */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
          <StatusItem
            icon={<Thermometer className="w-4 h-4" />}
            label="TERMAL"
            value={state.warmth}
            isCritical={state.warmth < 25}
            color={state.planet === 'IGNIS' ? 'bg-orange-600' : 'bg-emerald-500'}
          />
          <StatusItem
            icon={<Utensils className="w-4 h-4" />}
            label="KALORI"
            value={state.hunger}
            isCritical={state.hunger < 25}
          />
          <StatusItem
            icon={<Heart className="w-4 h-4" />}
            label="KESEHATAN"
            value={state.health}
            isCritical={state.health < 25}
          />
          <div className="pt-0 lg:pt-2 lg:border-t border-emerald-900/30">
            <StatusItem
              icon={
                <Radio
                  className={`w-4 h-4 ${state.signalProgress > 0 ? 'animate-pulse text-cyan-500' : ''
                    }`}
                />
              }
              label="SINYAL"
              value={state.signalProgress}
              isCritical={false}
              color="bg-cyan-500"
            />
          </div>
        </div>

        {/* Inventory */}
        <InventoryPanel items={state.inventory} />

        {/* Footer Info */}
        <div className="mt-8 pt-4 border-t border-emerald-900/30 flex justify-between items-center text-[10px] uppercase tracking-widest leading-relaxed">
          <div>
            Sektor: {state.planet}
            <br />
            Lokasi: {state.location}
            <br />
            Hari: {Math.floor(state.day)} | {state.difficulty}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
