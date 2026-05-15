/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/features/auth';
import { useGameState } from '@/features/game';
import { ErrorBoundary } from '@/features/game/components/ErrorBoundary';

// ─── Code-Split Screens ─────────────────────────────────────────────
const LoginScreen = lazy(() => import('@/features/auth/screens/LoginScreen'));
const StartScreen = lazy(() => import('@/features/game/screens/StartScreen'));
const GameScreen = lazy(() => import('@/features/game/screens/GameScreen'));
const WinScreen = lazy(() => import('@/features/game/screens/WinScreen'));
const LoadingScreen = lazy(() => import('@/features/game/screens/LoadingScreen'));

/** Suspense fallback — minimal loading indicator. */
function ScreenFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="text-emerald-500 animate-pulse font-mono tracking-widest text-sm">
        MEMUAT MODUL...
      </div>
    </div>
  );
}

/** Screen transition animation variants (scale + fade). */
const screenVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export default function App() {
  // ─── Auth ───────────────────────────────────────────────────────
  const {
    user,
    authError,
    handleLogin,
    handleLogout,
    handleSkipLogin,
  } = useAuth(
    () => game.setGameScreen((prev) => (prev === 'LOGIN' ? 'START' : prev)),
    () => {
      game.setGameScreen('LOGIN');
    }
  );

  // ─── Game ───────────────────────────────────────────────────────
  const game = useGameState('LOGIN');

  // ─── Screen Router ──────────────────────────────────────────────
  return (
    <ErrorBoundary>
    <Suspense fallback={<ScreenFallback />}>
      <AnimatePresence mode="wait">
        {game.gameScreen === 'LOGIN' && (
          <motion.div key="login" {...screenVariants} transition={{ duration: 0.4 }}>
            <LoginScreen
              onLogin={handleLogin}
              onSkip={() => {
                handleSkipLogin();
                game.setGameScreen('START');
              }}
              authError={authError}
            />
          </motion.div>
        )}

        {game.gameScreen === 'START' && (
          <motion.div key="start" {...screenVariants} transition={{ duration: 0.4 }}>
            <StartScreen
              user={user}
              onStart={game.handleStartGame}
              onLoad={game.handleLoadGame}
              onLogout={handleLogout}
              handleToggleAudio={game.handleToggleAudio}
              isAudioEnabled={game.isAudioEnabled}
            />
          </motion.div>
        )}

        {game.gameScreen === 'LOADING' && (
          <motion.div key="loading" {...screenVariants} transition={{ duration: 0.3 }}>
            <LoadingScreen />
          </motion.div>
        )}

        {game.gameScreen === 'PLAYING' && game.state && (
          <motion.div key="playing" {...screenVariants} transition={{ duration: 0.4 }}>
            <GameScreen
              state={game.state}
              user={user}
              logs={game.logs}
              input={game.input}
              isProcessing={game.isProcessing}
              isSaving={game.isSaving}
              isAudioEnabled={game.isAudioEnabled}
              onToggleAudio={game.handleToggleAudio}
              onExitToMenu={game.handleExitToMenu}
              onLogout={handleLogout}
              onInputChange={game.setInput}
              onSubmit={game.handleSubmit}
            />
          </motion.div>
        )}

        {game.gameScreen === 'WON' && (
          <motion.div key="won" {...screenVariants} transition={{ duration: 0.4 }}>
            <WinScreen planetName={game.state?.planet || 'UNKNOWN'} />
          </motion.div>
        )}
      </AnimatePresence>
    </Suspense>
    </ErrorBoundary>
  );
}
