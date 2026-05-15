import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';

interface WinScreenProps {
  planetName: string;
}

/** Victory screen displayed when the player successfully escapes. */
export default function WinScreen({ planetName }: WinScreenProps) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black p-8 text-center space-y-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-emerald-500 space-y-4"
      >
        <Trophy className="w-20 h-20 mx-auto" />
        <h1 className="text-4xl font-black tracking-widest uppercase">Misi Berhasil</h1>
        <p className="text-emerald-800 max-w-md mx-auto italic">
          Kamu berhasil mengirimkan koordinat terakhirmu tepat sebelum modul evakuasi diluncurkan.
          Planet {planetName} sekarang berada di belakangmu, menjadi titik kecil yang mendingin di
          kegelapan ruang angkasa.
        </p>
      </motion.div>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-emerald-500 text-black font-bold uppercase rounded hover:bg-emerald-400 transition-all font-mono tracking-widest"
      >
        Kembali ke Menu Utama
      </button>
    </div>
  );
}
