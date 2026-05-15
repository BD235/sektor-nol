import React from 'react';
import { motion } from 'motion/react';
import type { LogEntry as LogEntryType } from '@/lib/types';

interface LogEntryProps {
  entry: LogEntryType;
}

/** Single log entry in the game console. Memoized for streaming performance. */
const LogEntry = React.memo(function LogEntry({ entry }: LogEntryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-sm leading-relaxed whitespace-pre-wrap ${
        entry.type === 'action'
          ? 'text-amber-500 font-bold'
          : entry.type === 'system'
            ? 'text-cyan-500 opacity-50 text-[10px]'
            : ''
      }`}
    >
      {entry.type === 'action' && <span className="opacity-50 mr-2 text-xs">INPUT:</span>}
      {entry.text}
    </motion.div>
  );
});

export default LogEntry;
