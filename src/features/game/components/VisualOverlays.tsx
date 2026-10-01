import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { VisualEffect } from '@/lib/types';

interface VisualOverlaysProps {
  effect: VisualEffect;
}

/** Renders full-screen frost/heat/critical visual overlays with enter/exit animations. */
const VisualOverlays = React.memo(function VisualOverlays({ effect }: VisualOverlaysProps) {
  const activeEffect = (effect as string) === 'FROST' ? 'FROST_MEDIUM' : effect;

  // [KOMENTAR ANIMASI MOTION]
  // AnimatePresence mendeteksi ketika sebuah elemen motion dihapus dari DOM.
  // Ini memungkinkan kita untuk menjalankan animasi 'exit' (memudar keluar) 
  // secara mulus sebelum komponen benar-benar dihancurkan oleh React.
  return (
    <AnimatePresence>
      {activeEffect === 'FROST_NORMAL' && (
        <motion.div
          key="frost-normal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="frost-normal"
        />
      )}
      {activeEffect === 'FROST_MEDIUM' && (
        <motion.div
          key="frost-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="frost-medium"
        />
      )}
      {activeEffect === 'FROST_EXTREME' && (
        <motion.div
          key="frost-extreme"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="frost-extreme"
        />
      )}
      {activeEffect === 'HEAT_NORMAL' && (
        <motion.div
          key="heat-normal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="heat-normal"
        />
      )}
      {activeEffect === 'HEAT_MEDIUM' && (
        <motion.div
          key="heat-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="heat-medium"
        />
      )}
      {activeEffect === 'HEAT_EXTREME' && (
        <motion.div
          key="heat-extreme"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="heat-extreme"
        />
      )}
      {activeEffect === 'CRITICAL' && (
        <motion.div
          key="critical"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="critical-overlay"
        />
      )}
    </AnimatePresence>
  );
});

export default VisualOverlays;
