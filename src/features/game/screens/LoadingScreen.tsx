import React from 'react';

/** Loading screen shown during Firestore save recovery. */
export default function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="text-emerald-500 animate-pulse font-mono tracking-widest text-xl">
        MENGHUBUNGKAN KE SATELIT RECOVERY...
      </div>
    </div>
  );
}
