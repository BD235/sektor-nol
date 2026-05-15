import React from 'react';
import { motion } from 'motion/react';
import { Terminal as TerminalIcon, LogIn } from 'lucide-react';
import type { LoginScreenProps } from '@/lib/types';

/** Login screen with animated particles, Google auth button, and skip option. */
export default function LoginScreen({ onLogin, onSkip, authError }: LoginScreenProps) {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-500/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0,
            }}
            animate={{ y: [null, -100], opacity: [0, 0.8, 0] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center space-y-10 max-w-md w-full"
      >
        {/* Logo & Title */}
        <div className="space-y-4">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-500 flex items-center justify-center gap-2 md:gap-4"
          >
            <TerminalIcon className="w-8 h-8 md:w-10 md:h-10" /> SEKTOR NOL
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-emerald-800 text-sm italic">
              "Keheningan adalah satu-satunya temanmu di sini."
            </p>
            <p className="text-emerald-900/60 text-[10px] uppercase tracking-widest font-bold mt-2">
              v0.9.0 - Cerita Belum Sepenuhnya Selesai
            </p>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"
          />
        </div>

        {/* Game description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-emerald-900 text-xs leading-relaxed max-w-sm tracking-wide uppercase"
        >
          Simulasi bertahan hidup di planet berbahaya. Login untuk menyimpan progress permainanmu.
        </motion.p>

        {/* Login Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="w-full space-y-4"
        >
          <button
            onClick={onLogin}
            className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-100 font-black uppercase text-sm rounded-lg hover:bg-emerald-900/40 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md active:scale-[0.98] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <LogIn className="w-5 h-5" /> Login dengan Google
            </span>
            <div className="absolute inset-0 bg-emerald-500/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>

          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-red-500 font-bold bg-red-950/20 px-4 py-2 rounded border border-red-900/50"
            >
              {authError.toUpperCase()} - COBA BUKA APLIKASI DI TAB BARU JIKA MASALAH BERLANJUT
            </motion.div>
          )}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-4 w-full"
        >
          <div className="flex-1 h-[1px] bg-emerald-900/30" />
          <span className="text-emerald-900 text-[10px] uppercase tracking-widest">atau</span>
          <div className="flex-1 h-[1px] bg-emerald-900/30" />
        </motion.div>

        {/* Skip Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          onClick={onSkip}
          className="text-emerald-600 hover:text-emerald-400 text-xs uppercase tracking-[0.3em] font-bold transition-colors hover:tracking-[0.4em] duration-300"
        >
          Lewati &rarr;
        </motion.button>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-emerald-900 text-xs leading-relaxed max-w-sm tracking-wide uppercase mt-4"
        >
          Proses tidak disimpan tanpa login
        </motion.p>
      </motion.div>
    </div>
  );
}
