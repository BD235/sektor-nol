import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from "canvas-confetti";
import type { User } from 'firebase/auth';
import type { GameState, LogEntry } from '@/lib/types';
import { soundEngine } from '@/core';
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWinDialog, setShowWinDialog] = useState(false);

  useEffect(() => {
    if (logs.length <= 2) {
      // Memberikan jeda 800ms sebelum dialog muncul agar transisi ke GameScreen selesai
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []); // Hanya dijalankan saat komponen pertama kali dirender

  // Munculkan dialog kemenangan beberapa detik setelah percakapan AI selesai
  useEffect(() => {
    if (state.isWon && !isProcessing) {
      const timer = setTimeout(() => {
        setShowWinDialog(true);
        
        if (isAudioEnabled) {
          soundEngine.stopAmbience();
          soundEngine.playWin();
        }

        // Trigger confetti
        const end = Date.now() + 3 * 1000;
        const colors = ["#10b981", "#06b6d4", "#a786ff", "#f8deb1"];
        const frame = () => {
          if (Date.now() > end) return;
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            startVelocity: 60,
            origin: { x: 0, y: 0.5 },
            colors: colors,
            zIndex: 1000,
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            startVelocity: 60,
            origin: { x: 1, y: 0.5 },
            colors: colors,
            zIndex: 1000,
          });
          requestAnimationFrame(frame);
        };
        frame();

      }, 3000); // Jeda 3 detik
      return () => clearTimeout(timer);
    }
  }, [state.isWon, isProcessing]);

  const getTutorialText = () => {
    switch (state.planet) {
      case 'AETHELGARD':
        return 'Selamat datang di Aethelgard-7. Planet es dengan suhu yang mematikan. Anda harus terus mencari sumber panas, membuat perapian, dan berlindung dari badai salju. Jika Termal habis, Anda akan membeku.\n\nTujuan akhir Anda adalah bertahan hidup, memecahkan misteri planet, dan mencari jalan keluar dengan menemukan menara komunikasi darurat atau puing pesawat.\n\nKetik perintah seperti "Cari kayu bakar", "Buat api unggun", atau "Eksplorasi ke utara" di terminal untuk beraksi.';
      case 'IGNIS':
        return 'Selamat datang di Ignis Prime. Planet ini dipenuhi magma dan panas yang ekstrem. Anda harus mencari tempat teduh, sistem pendingin, dan menghindari area vulkanik. Jika Termal terlalu tinggi, Anda akan mati kepanasan.\n\nTujuan akhir Anda adalah bertahan hidup dan melarikan diri dari planet ini, misalnya dengan mengirimkan sinyal SOS melalui stasiun peninggalan yang terbengkalai.\n\nKetik perintah seperti "Cari tempat teduh", "Eksplorasi reruntuhan", atau "Cari air" di terminal untuk beraksi.';
      default:
        return 'Selamat datang di simulasi bertahan hidup. Terus pantau status Darah dan Termal Anda.\n\nTujuan akhir Anda adalah bertahan hidup cukup lama untuk menemukan cara melarikan diri dari kondisi ini.\n\nGunakan terminal untuk mengetik perintah seperti "Eksplorasi sekitar", "Cari makanan", atau "Istirahat".';
    }
  };

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
        isTerminalOffline={state.health <= 0 || state.isWon}
        planetName={state.planet}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />

      {state.health <= 0 && <DeathPanel />}

      {showTutorial && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-transparent backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-emerald-950 border border-emerald-500/50 p-5 md:p-6 rounded-lg w-[95vw] max-w-md max-h-[85vh] overflow-y-auto scrollbar-hide text-left relative shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          >
            <h3 className="text-xl md:text-2xl font-black text-emerald-400 mb-4 uppercase tracking-wider flex items-center gap-2 md:gap-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
              PANDUAN SURVIVAL
            </h3>
            
            <div className="space-y-3 mb-6">
              {getTutorialText().split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="text-emerald-100/90 text-xs md:text-sm leading-relaxed text-justify">
                  {paragraph}
                </p>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowTutorial(false)}
              className="w-full py-3 md:py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded font-black transition-all uppercase tracking-[0.2em] text-xs md:text-sm active:scale-[0.98]"
            >
              MULAI
            </button>
          </motion.div>
        </div>,
        document.body
      )}

      {showWinDialog && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-emerald-950 border border-emerald-500/50 p-6 md:p-8 rounded-lg w-[95vw] max-w-md max-h-[85vh] overflow-y-auto scrollbar-hide flex flex-col items-center text-center relative shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 w-6 h-6">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-emerald-400 mb-4 uppercase tracking-wider">
              MISI SELESAI
            </h3>
            
            <p className="text-emerald-100/90 text-sm md:text-base leading-relaxed mb-6">
              Evakuasi berhasil. Anda telah selamat dari {state.planet} dan menyelesaikan simulasi ini dengan gemilang. Anda sekarang aman dan meninggalkan planet ini.
            </p>

            <p className="text-emerald-500/80 font-mono text-xs md:text-xs uppercase tracking-[0.3em] mb-8">
              {state.difficulty}
            </p>

            <button
              type="button"
              onClick={onExitToMenu}
              className="w-full py-3 md:py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded font-black transition-all uppercase tracking-[0.2em] text-xs md:text-sm active:scale-[0.98]"
            >
              KEMBALI KE MENU
            </button>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
