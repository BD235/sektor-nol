import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  Terminal as TerminalIcon,
  Volume2,
  VolumeX,
  Zap,
  Skull,
  Shield,
  Snowflake,
  Flame,
  LogOut,
} from 'lucide-react';
import { soundEngine } from '@/core';
import type { StartScreenProps, Difficulty, Planet } from '@/lib/types';
import SelectionButton from '../components/SelectionButton';

/** Start screen — character name input, planet/difficulty selection, and game launch. */
export default function StartScreen({
  user,
  onStart,
  onLoad,
  onLogout,
  handleToggleAudio,
  isAudioEnabled,
}: StartScreenProps) {
  const [characterName, setCharacterName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('SURVIVOR');
  const [planet, setPlanet] = useState<Planet>('AETHELGARD');
  const [infoDialog, setInfoDialog] = useState<{ title: string; content: string } | null>(null);

  const handlePlanetChange = (p: Planet) => {
    if (isAudioEnabled) soundEngine.playClick();
    setPlanet(p);
  };

  const handleDifficultyChange = (d: Difficulty) => {
    if (isAudioEnabled) soundEngine.playClick();
    setDifficulty(d);
  };

  const handleOpenInfo = (title: string, content: string) => {
    if (isAudioEnabled) soundEngine.playClick();
    setInfoDialog({ title, content });
  };

  const handleCloseInfo = () => {
    if (isAudioEnabled) soundEngine.playClick();
    setInfoDialog(null);
  };

  const handleStart = () => {
    if (isAudioEnabled) soundEngine.playStart();
    onStart(characterName, difficulty, planet);
  };

  const handleLoad = () => {
    if (isAudioEnabled) soundEngine.playClick();
    onLoad();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center items-center p-4 md:p-8 text-center space-y-8 md:space-y-12 max-w-4xl mx-auto overflow-y-auto scrollbar-hide py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-500 flex items-center justify-center gap-2 md:gap-4">
          <TerminalIcon className="w-8 h-8 md:w-10 md:h-10" /> SEKTOR NOL
        </h1>
        <p className="text-emerald-800 text-sm italic">
          "Keheningan adalah satu-satunya temanmu di sini."
        </p>
        <p className="text-emerald-900/60 text-[10px] uppercase tracking-widest font-bold mt-2">
          v0.9.0 - Cerita Belum Sepenuhnya Selesai
        </p>
      </motion.div>

      {/* User Info Bar */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex justify-center px-4"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 bg-emerald-950/20 border border-emerald-900/50 p-4 sm:px-6 sm:py-3 rounded-lg w-full max-w-sm sm:max-w-fit mx-auto shadow-xl">
            
            {/* Avatar & Name */}
            <div className="flex items-center gap-3 shrink-0">
              <img
                src={user.photoURL || ''}
                alt=""
                className="w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-emerald-500 shadow-lg shadow-emerald-500/20 object-cover bg-emerald-900/50"
              />
              <div className="text-left">
                <div className="text-sm sm:text-xs font-bold text-emerald-500 uppercase truncate max-w-[180px] md:max-w-[250px]">
                  {user.displayName}
                </div>
                <div className="text-xs sm:text-[10px] text-emerald-900 tracking-wider">SISTEM TERHUBUNG</div>
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-full h-[1px] sm:w-[1px] sm:h-8 bg-emerald-900/50 shrink-0" />
            
            {/* Buttons */}
            <div className="flex flex-row gap-2 shrink-0 w-full sm:w-auto justify-center">
              <button
                onClick={handleLoad}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 sm:px-4 bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 text-xs font-bold rounded hover:bg-cyan-500/20 transition-all active:scale-95"
                title="Recover Progress"
              >
                <Zap className="w-4 h-4 shrink-0" /> 
                <span className="truncate">RECOVER PROGRESS</span>
              </button>
              <button
                onClick={onLogout}
                className="flex-none sm:flex-none flex items-center justify-center gap-2 px-3 py-2 sm:px-4 bg-red-900/10 border border-red-900/30 text-red-700 hover:text-red-500 hover:bg-red-900/20 hover:border-red-500/50 text-xs rounded font-bold uppercase tracking-widest transition-all active:scale-95"
                title="Logout"
              >
                <LogOut className="w-4 h-4 shrink-0" /> 
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </div>
            
          </div>
        </motion.div>
      )}

      {/* Character Name */}
      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-xs font-bold opacity-50 uppercase tracking-[0.3em]">
          Identifikasi Pilot
        </h2>
        <input
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value.toUpperCase())}
          onFocus={() => { if (isAudioEnabled) soundEngine.playClick(); }}
          placeholder="Masukan nama..."
          maxLength={15}
          className="w-full bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg text-center text-emerald-400 font-mono tracking-widest outline-none focus:border-emerald-500 transition-colors uppercase"
        />
      </div>

      {/* Planet & Difficulty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Planet Selection */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold opacity-50 uppercase tracking-widest">Pilih Lokasi</h2>
          <div className="flex flex-col gap-2">
            <SelectionButton
              isActive={planet === 'AETHELGARD'}
              onClick={() => handlePlanetChange('AETHELGARD')}
              icon={<Snowflake />}
              name="Aethelgard-7"
              description="Neraka Es & Nitrogen"
              onInfoClick={() => handleOpenInfo(
                'Aethelgard-7',
                'Planet samudera beku. Udara beracun dan suhu ekstrem dapat membekukan karaktermu dengan cepat. Selalu awasi tingkat Termal (Warmth).'
              )}
            />
            <SelectionButton
              isActive={planet === 'IGNIS'}
              onClick={() => handlePlanetChange('IGNIS')}
              icon={<Flame />}
              name="Ignis Prime"
              description="Inti Obsidian Membara"
              onInfoClick={() => handleOpenInfo(
                'Ignis Prime',
                'Dunia vulkanik dengan paparan panas luar biasa. Fokus utama di planet ini adalah mencari peneduh dan memanajemen sistem pendingin.'
              )}
            />
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold opacity-50 uppercase tracking-widest">
            Tingkat Kesulitan
          </h2>
          <div className="flex flex-col gap-2">
            <SelectionButton
              isActive={difficulty === 'RECRUIT'}
              onClick={() => handleDifficultyChange('RECRUIT')}
              icon={<Shield />}
              name="Recruit"
              description="Casual Survival"
              onInfoClick={() => handleOpenInfo(
                'Recruit',
                'Memulai dengan 100% semua status, mendapat 3 ransum, pemicu api, peta digital, dan senjata awal. Cocok untuk pemula.'
              )}
            />
            <SelectionButton
              isActive={difficulty === 'SURVIVOR'}
              onClick={() => handleDifficultyChange('SURVIVOR')}
              icon={<Zap />}
              name="Survivor"
              description="Standard Logic"
              onInfoClick={() => handleOpenInfo(
                'Survivor',
                'Status standar, 1 ransum awal, pemicu api, dan senjata awal. Pengalaman bertahan hidup standar Sektor Nol.'
              )}
            />
            <SelectionButton
              isActive={difficulty === 'GHOST'}
              onClick={() => handleDifficultyChange('GHOST')}
              icon={<Skull />}
              name="Ghost"
              description="Hardcore Simulation"
              onInfoClick={() => handleOpenInfo(
                'Ghost',
                'Memulai dengan status yang sudah menurun drastis dan tanpa barang bawaan sama sekali. Hanya untuk veteran.'
              )}
            />
          </div>
        </div>
      </div>

      {/* Launch Controls */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleStart}
          className="group relative px-12 py-4 bg-emerald-500 text-black font-bold uppercase tracking-[0.2em] rounded overflow-hidden hover:bg-emerald-400 transition-all active:scale-95"
        >
          <span className="relative z-10">Mulai Simulasi</span>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
        </button>

        <button
          onClick={handleToggleAudio}
          className="flex items-center gap-2 text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          {isAudioEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          {isAudioEnabled ? 'AUDIO AKTIF' : 'AUDIO NONAKTIF'}
        </button>
      </div>

      {/* Info Dialog Overlay */}
      {infoDialog && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-950 border border-emerald-500/50 p-6 rounded-lg max-w-sm w-full text-left relative"
          >
            <h3 className="text-xl font-bold text-emerald-400 mb-2 uppercase">{infoDialog.title}</h3>
            <p className="text-emerald-100 text-sm opacity-90 leading-relaxed mb-6">{infoDialog.content}</p>
            <button
              type="button"
              onClick={handleCloseInfo}
              className="w-full py-2 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 rounded border border-emerald-700 transition-all uppercase tracking-widest text-xs font-bold active:scale-[0.98]"
            >
              Tutup
            </button>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
