import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import type { LogEntry as LogEntryType } from '@/lib/types';
import LogEntry from './LogEntry';

interface GameConsoleProps {
  logs: LogEntryType[];
  input: string;
  isProcessing: boolean;
  isTerminalOffline: boolean;
  planetName: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** Main gameplay console — displays narrative logs and accepts player commands. */
export default function GameConsole({
  logs,
  input,
  isProcessing,
  isTerminalOffline,
  planetName,
  onInputChange,
  onSubmit,
}: GameConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new log entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <main className="flex-1 flex flex-col border-2 border-emerald-900/50 bg-black/40 rounded-lg overflow-hidden backdrop-blur-sm relative z-10">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4">
        <AnimatePresence mode="popLayout">
          {logs.map((log) => (
            <LogEntry key={log.id} entry={log} />
          ))}
        </AnimatePresence>
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs animate-pulse opacity-50">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
            SINKRONISASI DATA...
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={onSubmit}
        className="p-4 border-t-2 border-emerald-900/50 bg-emerald-950/10 flex items-center gap-3"
      >
        <ChevronRight className="w-5 h-5 text-emerald-500 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={isProcessing || isTerminalOffline}
          placeholder={
            isTerminalOffline
              ? 'TERMINAL OFFLINE...'
              : `Masukkan tindakanmu di ${planetName}...`
          }
          className="flex-1 bg-transparent border-none outline-none text-emerald-400 placeholder:text-emerald-900 disabled:opacity-50"
          autoFocus
        />
      </form>
    </main>
  );
}
