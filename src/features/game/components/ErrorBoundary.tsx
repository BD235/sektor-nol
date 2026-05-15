// @ts-nocheck — React 19 ships without .d.ts; @types/react not installed.
// Remove this directive after running: npm install -D @types/react
import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches uncaught errors in the component tree
 * and displays a themed fallback UI instead of a blank white screen.
 *
 * Kenapa ini penting:
 * - Jika AI response gagal di-parse, atau komponen crash, user tetap melihat UI
 * - Tanpa ini, satu error di child component = SELURUH app hilang (blank screen)
 * - React class component diperlukan karena hooks belum support error boundaries
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SEKTOR NOL] Uncaught Error:', error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

// ─── Fallback UI ────────────────────────────────────────────────────

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/** Themed error fallback that matches the CRT terminal aesthetic. */
function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-6"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full border-2 border-red-900/50 bg-red-950/20">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-red-500 tracking-widest uppercase">
            SYSTEM MALFUNCTION
          </h1>
          <p className="text-emerald-800 text-xs uppercase tracking-widest">
            Modul mengalami kegagalan kritis
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 text-left">
          <p className="text-[10px] text-red-500/70 font-mono uppercase tracking-wider mb-2">
            ERROR LOG:
          </p>
          <p className="text-xs text-red-400 font-mono break-all">
            {error?.message || 'Unknown error'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded hover:bg-emerald-500/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            COBA LAGI
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-red-900/30 border border-red-900/50 text-red-400 font-bold text-xs uppercase tracking-widest rounded hover:bg-red-900/50 transition-all"
          >
            REBOOT SISTEM
          </button>
        </div>

        {/* Footer */}
        <p className="text-emerald-900 text-[9px] uppercase tracking-widest">
          Jika masalah berlanjut, coba muat ulang halaman
        </p>
      </motion.div>
    </div>
  );
}
