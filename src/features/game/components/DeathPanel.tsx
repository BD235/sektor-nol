import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

/** Game over panel shown when player health reaches zero. */
const DeathPanel = React.memo(function DeathPanel() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
    >
      <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="border-2 border-red-900 bg-red-950/40 p-4 rounded-lg text-red-500 font-bold text-center"
    >
      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
      VISUAL SIGNAL LOST
      <br />
      PLAYER DECEASED
      <button
        onClick={() => window.location.reload()}
        className="mt-4 w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-white text-xs rounded border border-red-500 transition-colors"
      >
        REBOOT SYSTEM
      </button>
    </motion.div>
    </motion.div>
  );
});

export default DeathPanel;
