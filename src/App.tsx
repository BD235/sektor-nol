/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Thermometer, 
  Utensils, 
  Heart, 
  Package, 
  Terminal as TerminalIcon, 
  ChevronRight, 
  Wind, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Zap, 
  Skull, 
  Shield, 
  Snowflake, 
  Flame, 
  LogIn, 
  LogOut, 
  CloudUpload,
  Radio,
  Trophy
} from 'lucide-react';
import { DIFFICULTY_SETTINGS, GameState, Difficulty, VisualEffect } from './types';
import { streamGameAction } from './gameEngine';
import { soundEngine } from './soundEngine';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface LogEntry {
  type: 'action' | 'narrative' | 'system';
  text: string;
}

export default function App() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'LOADING' | 'WON'>('START');
  const [state, setState] = useState<GameState | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLogs(prev => [...prev, { type: 'system', text: `[SYSTEM: TERHUBUNG SEBAGAI ${currentUser.displayName?.toUpperCase()}]` }]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleAudio = () => {
    if (audioEnabled) {
      soundEngine.stopAmbience();
      setAudioEnabled(false);
    } else {
      if (state) soundEngine.startAmbience(state.planet);
      setAudioEnabled(true);
      soundEngine.playClick();
    }
  };

  const exitToMenu = () => {
    if (audioEnabled) {
      soundEngine.playClick();
      soundEngine.stopAmbience();
    }
    setGameState('START');
    setState(null);
    setLogs([]);
  };

  const login = async () => {
    setAuthError(null);
    setLogs(prev => [...prev, { type: 'system', text: "[AUTH: MENGHUBUNGKAN KE GOOGLE...]" }]);
    try {
      await signInWithPopup(auth, googleProvider);
      if (audioEnabled) soundEngine.playClick();
    } catch (error: any) {
      console.error("Login failed", error);
      let errorMsg = "Login gagal.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = "Login dibatalkan (Popup ditutup).";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMsg = "Permintaan login dibatalkan.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMsg = "Popup terblokir oleh browser.";
      } else if (error.message.includes('cross-origin-opener-policy')) {
        errorMsg = "Browser menghalangi login di dalam frame ini.";
      }
      setAuthError(errorMsg);
      setLogs(prev => [...prev, { type: 'system', text: `[ERROR: ${errorMsg.toUpperCase()}]` }]);
      // Also show a hint about opening in new tab
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        setLogs(prev => [...prev, { type: 'system', text: "[INFO: JIKA MASALAH BERLANJUT, COBA BUKA APLIKASI DI TAB BARU MELALUI MENU SETTINGS]" }]);
      }
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setGameState('START');
      setState(null);
      setLogs([]);
      if (audioEnabled) {
        soundEngine.playClick();
        soundEngine.stopAmbience();
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const saveGame = async (gameData: GameState) => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    const path = `saves/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, path), {
        ...gameData,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const loadGame = async () => {
    if (!auth.currentUser) return;
    setGameState('LOADING');
    const path = `saves/${auth.currentUser.uid}`;
    try {
      const docSnap = await getDoc(doc(db, path));
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        const loadedState: GameState = {
          characterName: data.characterName || 'N' + Math.floor(Math.random() * 1000),
          difficulty: data.difficulty,
          planet: data.planet,
          health: data.health,
          warmth: data.warmth,
          hunger: data.hunger,
          inventory: data.inventory,
          day: data.day,
          location: data.location,
          visualEffect: data.visualEffect || 'NONE',
          signalProgress: data.signalProgress || 0
        };
        setState(loadedState);
        setGameState('PLAYING');
        setLogs([
          { type: 'system', text: `--- RECOVERY DATA: ${loadedState.planet} | ${loadedState.difficulty} ---` },
          { type: 'narrative', text: `Sinkronisasi selesai. Kamu berada di ${loadedState.location}.` }
        ]);
        if (audioEnabled) {
          soundEngine.playDiscovery();
          soundEngine.startAmbience(loadedState.planet);
        }
      } else {
        setLogs(prev => [...prev, { type: 'system', text: "[ERROR: DATA TIDAK DITEMUKAN]" }]);
        setGameState('START');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  };

  const startGame = (characterName: string, difficulty: Difficulty, planet: 'AETHELGARD' | 'IGNIS') => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const initialState: GameState = {
      characterName: characterName || 'EXPLORER',
      difficulty,
      planet,
      health: settings.health || 100,
      warmth: settings.warmth || 100,
      hunger: settings.hunger || 100,
      inventory: [...(settings.inventory || [])],
      day: 1,
      location: planet === 'AETHELGARD' ? "Modul Medis Beku" : "Landasan Esekusi Basal",
      visualEffect: 'NONE',
      signalProgress: 0
    };

    setState(initialState);
    setGameState('PLAYING');
    setLogs([
      { type: 'system', text: `--- SISTEM DIINISIALISASI: ${planet} | ${difficulty} ---` },
      { 
        type: 'narrative', 
        text: planet === 'AETHELGARD' 
          ? 'Hawa dingin membekukan paru-parumu saat kamu terbangun. Kristal nitrogen mulai menumpuk di kaca helm. Kamu harus bergerak atau kamu akan membeku di sini.'
          : 'Cahaya ganda matahari membakar sensor termalmu. Udara di luar mencapai 180°C. Pendingin baju ruang angkasamu berdengung keras, mencoba menyeimbangkan panas ekstrem ini.'
      }
    ]);
    if (audioEnabled) {
      soundEngine.playDiscovery();
      soundEngine.startAmbience(planet);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !state || state.health <= 0) return;

    if (audioEnabled) soundEngine.playClick();

    const userAction = input.trim();
    setInput('');
    setIsProcessing(true);
    setLogs(prev => [...prev, { type: 'action', text: userAction }]);

    // Prepare for narrative stream
    setLogs(prev => [...prev, { type: 'narrative', text: '' }]);
    let narrativeText = "";

    try {
      const stream = streamGameAction(userAction, state);
      
      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          narrativeText += chunk.text;
          setLogs(prev => {
            const newLogs = [...prev];
            if (newLogs.length > 0) {
              newLogs[newLogs.length - 1] = { ...newLogs[newLogs.length - 1], text: narrativeText };
            }
            return newLogs;
          });
        } else if (chunk.type === 'data') {
          const updates = chunk.data;
          
          if (audioEnabled) {
            if (updates.items_added?.length > 0) soundEngine.playDiscovery();
            if (updates.health_delta < -10 || updates.warmth_delta < -15) soundEngine.playAlert();
            if (Math.random() < 0.15) soundEngine.playCreature();
          }

          setState(prev => {
            if (!prev) return null;
            const nextState: GameState = {
              ...prev,
              warmth: Math.min(100, Math.max(0, prev.warmth + updates.warmth_delta)),
              hunger: Math.min(100, Math.max(0, prev.hunger + updates.hunger_delta)),
              health: Math.min(100, Math.max(0, prev.health + updates.health_delta)),
              signalProgress: Math.min(100, Math.max(0, prev.signalProgress + (updates.signal_delta || 0))),
              inventory: Array.from(new Set([...prev.inventory.filter(item => !updates.items_removed.includes(item)), ...updates.items_added])),
              location: updates.new_location || prev.location,
              day: prev.day + 0.1,
              visualEffect: updates.effect || (prev.health + updates.health_delta < 25 ? 'CRITICAL' : 'NONE')
            };

            if (updates.is_win) {
              setGameState('WON');
            }

            if (audioEnabled && nextState.health <= 0 && prev.health > 0) soundEngine.playDeath();
            
            if (auth.currentUser) {
              saveGame(nextState);
            }
            
            return nextState;
          });
        }
      }
    } catch (error) {
      console.error("Game stream error:", error);
      setLogs(prev => [...prev, { type: 'system', text: "[ERROR: GANGGUAN KOMUNIKASI SATELIT]" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (gameState === 'START') {
    return (
      <StartScreen 
        user={user} 
        onStart={startGame} 
        onLoad={loadGame} 
        onLogin={login} 
        onLogout={logout} 
        toggleAudio={toggleAudio} 
        audioEnabled={audioEnabled} 
        authError={authError}
      />
    );
  }

  if (gameState === 'WON') {
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
            Planet {state?.planet} sekarang berada di belakangmu, menjadi titik kecil yang mendingin di kegelapan ruang angkasa.
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

  if (gameState === 'LOADING') {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-emerald-500 animate-pulse font-mono tracking-widest text-xl">
          MENGHUBUNGKAN KE SATELIT RECOVERY...
        </div>
      </div>
    );
  }

  if (!state) return null;

  return (
    <div className="flex flex-col h-[100dvh] p-3 md:p-8 md:flex-row gap-4 md:gap-6 relative overflow-hidden">
      {/* Visual Overlays */}
      <AnimatePresence>
        {state.visualEffect === 'FROST' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="frost-overlay" />}
        {state.visualEffect === 'HEAT' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="heat-overlay" />}
        {state.visualEffect === 'CRITICAL' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="critical-overlay" />}
      </AnimatePresence>

      {/* Sidebar - Status */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-80 flex flex-col gap-4 z-10"
      >
        <div className="border-2 border-emerald-900/50 bg-emerald-950/20 p-4 rounded-lg backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4 border-b border-emerald-900/50 pb-2">
            <div className="flex flex-col">
              <h1 className="text-xl font-black flex items-center gap-2">
                <TerminalIcon className="w-5 h-5 text-emerald-500" /> SEKTOR NOL
              </h1>
              <div className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                ID: {state.characterName.toUpperCase()}
              </div>
            </div>
            <div className="flex gap-2">
              {isSaving && (
                <div className="p-1.5 text-cyan-500 animate-pulse" title="Saving...">
                  <CloudUpload className="w-4 h-4" />
                </div>
              )}
              <button 
                onClick={toggleAudio}
                className={`p-1.5 rounded-full transition-colors ${audioEnabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-emerald-900 hover:text-emerald-700'}`}
                title={audioEnabled ? "Matikan Suara" : "Aktifkan Suara"}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button 
                onClick={exitToMenu}
                className="p-1.5 rounded-full text-emerald-900 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Keluar ke Menu Utama"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
            <StatusItem 
              icon={<Thermometer className="w-4 h-4" />} 
              label="TERMAL" 
              value={state.warmth} 
              critical={state.warmth < 25}
              color={state.planet === 'IGNIS' ? 'bg-orange-600' : 'bg-emerald-500'}
            />
            <StatusItem 
              icon={<Utensils className="w-4 h-4" />} 
              label="KALORI" 
              value={state.hunger} 
              critical={state.hunger < 25}
            />
            <StatusItem 
              icon={<Heart className="w-4 h-4" />} 
              label="KESEHATAN" 
              value={state.health} 
              critical={state.health < 25}
            />
            <div className="pt-0 lg:pt-2 lg:border-t border-emerald-900/30">
              <StatusItem 
                icon={<Radio className={`w-4 h-4 ${state.signalProgress > 0 ? 'animate-pulse text-cyan-500' : ''}`} />} 
                label="SINYAL" 
                value={state.signalProgress} 
                critical={false}
                color="bg-cyan-500"
              />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-bold opacity-70 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> INVENTORY
            </h2>
            <ul className="text-xs space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
              {state.inventory.length === 0 ? (
                <li className="italic opacity-50">Kosong</li>
              ) : (
                state.inventory.map((item, i) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={`${item}-${i}`} 
                    className="flex items-center gap-2 before:content-['>'] before:text-emerald-700"
                  >
                    {item}
                  </motion.li>
                ))
              )}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-emerald-900/30 flex justify-between items-center text-[10px] opacity-40 uppercase tracking-widest leading-relaxed">
            <div>
              Sektor: {state.planet}<br />
              Lokasi: {state.location}<br />
              Hari: {Math.floor(state.day)} | {state.difficulty}
            </div>
            {user && (
              <button 
                onClick={logout}
                className="hover:text-red-500 transition-colors flex flex-col items-center"
                title="Keluar (Progress tersimpan)"
              >
                <LogOut className="w-3 h-3 mb-1" />
                KELUAR
              </button>
            )}
          </div>
        </div>

        {state.health <= 0 && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="border-2 border-red-900 bg-red-950/40 p-4 rounded-lg text-red-500 font-bold text-center"
          >
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            VISUAL SIGNAL LOST<br/>PLAYER DECEASED
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-white text-xs rounded border border-red-500 transition-colors"
            >
              REBOOT SYSTEM
            </button>
          </motion.div>
        )}
      </motion.aside>

      {/* Main Console */}
      <main className="flex-1 flex flex-col border-2 border-emerald-900/50 bg-black/40 rounded-lg overflow-hidden backdrop-blur-sm relative z-10">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm leading-relaxed ${
                  log.type === 'action' ? 'text-amber-500 font-bold' : 
                  log.type === 'system' ? 'text-cyan-500 opacity-50 text-[10px]' : ''
                }`}
              >
                {log.type === 'action' && <span className="opacity-50 mr-2 text-xs">INPUT:</span>}
                {log.text}
              </motion.div>
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
          onSubmit={handleSubmit}
          className="p-4 border-t-2 border-emerald-900/50 bg-emerald-950/10 flex items-center gap-3"
        >
          <ChevronRight className="w-5 h-5 text-emerald-500 shrink-0" />
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing || state.health <= 0}
            placeholder={state.health <= 0 ? "TERMINAL OFFLINE..." : `Masukkan tindakanmu di ${state.planet}...`}
            className="flex-1 bg-transparent border-none outline-none text-emerald-400 placeholder:text-emerald-900 disabled:opacity-50"
            autoFocus
          />
        </form>
      </main>
    </div>
  );
}

function StartScreen({ user, onStart, onLoad, onLogin, onLogout, toggleAudio, audioEnabled, authError }: any) {
  const [characterName, setCharacterName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('SURVIVOR');
  const [planet, setPlanet] = useState<'AETHELGARD' | 'IGNIS'>('AETHELGARD');

  const handlePlanetChange = (p: 'AETHELGARD' | 'IGNIS') => {
    if (audioEnabled) soundEngine.playClick();
    setPlanet(p);
  };

  const handleDifficultyChange = (d: Difficulty) => {
    if (audioEnabled) soundEngine.playClick();
    setDifficulty(d);
  };

  const handleStart = () => {
    if (audioEnabled) soundEngine.playStart();
    onStart(characterName, difficulty, planet);
  };

  const handleLoad = () => {
    if (audioEnabled) soundEngine.playClick();
    onLoad();
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center space-y-12 max-w-4xl mx-auto overflow-y-auto scrollbar-hide py-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-5xl font-black tracking-tighter text-emerald-500 flex items-center justify-center gap-4">
          <TerminalIcon className="w-10 h-10" /> SEKTOR NOL
        </h1>
        <p className="text-emerald-800 text-sm italic">"Keheningan adalah satu-satunya temanmu di sini."</p>
      </motion.div>

      {/* User Info / Login */}
      <div className="w-full flex flex-col items-center gap-2">
        <div className="w-full flex justify-center bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg">
          {user ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-emerald-500 shadow-lg shadow-emerald-500/20" />
                <div className="text-left">
                  <div className="text-xs font-bold text-emerald-500 uppercase">{user.displayName}</div>
                  <div className="text-[10px] text-emerald-900">SISTEM TERHUBUNG</div>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-emerald-900/50" />
              <button 
                onClick={handleLoad}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 text-xs font-bold rounded hover:bg-cyan-500/20 transition-all"
              >
                <Zap className="w-4 h-4" /> RECOVER PROGRESS
              </button>
              <button 
                onClick={onLogout}
                className="text-[10px] text-red-900 hover:text-red-500 uppercase font-black tracking-widest transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> LOGOUT
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="flex items-center gap-3 px-8 py-3 bg-white text-black font-black uppercase text-xs rounded hover:bg-emerald-50 transition-all shadow-xl shadow-white/5 active:scale-95"
            >
              <LogIn className="w-4 h-4" /> Login dengan Google untuk Save Progress
            </button>
          )}
        </div>
        {authError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-red-500 font-bold bg-red-950/20 px-4 py-1 rounded border border-red-900/50"
          >
            {authError.toUpperCase()} - COBA BUKA APLIKASI DI TAB BARU JIKA MASALAH BERLANJUT
          </motion.div>
        )}
      </div>

      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-xs font-bold opacity-50 uppercase tracking-[0.3em]">Identifikasi Pilot</h2>
        <input 
          type="text" 
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value.toUpperCase())}
          placeholder="MASUKKAN KOORDINAT NAMA..."
          maxLength={15}
          className="w-full bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg text-center text-emerald-400 font-mono tracking-widest outline-none focus:border-emerald-500 transition-colors uppercase"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Planet Selection */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold opacity-50 uppercase tracking-widest">Pilih Lokasi</h2>
          <div className="flex flex-col gap-2">
            <PlanetButton 
              active={planet === 'AETHELGARD'} 
              onClick={() => handlePlanetChange('AETHELGARD')}
              icon={<Snowflake />}
              name="Aethethelgard-7"
              desc="Neraka Es & Nitrogen"
            />
            <PlanetButton 
              active={planet === 'IGNIS'} 
              onClick={() => handlePlanetChange('IGNIS')}
              icon={<Flame />}
              name="Ignis Prime"
              desc="Inti Obsidian Membara"
            />
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold opacity-50 uppercase tracking-widest">Tingkat Kesulitan</h2>
          <div className="flex flex-col gap-2">
            <DifficultyButton 
              active={difficulty === 'RECRUIT'} 
              onClick={() => handleDifficultyChange('RECRUIT')}
              icon={<Shield />}
              name="Recruit"
              desc="Casual Survival"
            />
            <DifficultyButton 
              active={difficulty === 'SURVIVOR'} 
              onClick={() => handleDifficultyChange('SURVIVOR')}
              icon={<Zap />}
              name="Survivor"
              desc="Standard Logic"
            />
            <DifficultyButton 
              active={difficulty === 'GHOST'} 
              onClick={() => handleDifficultyChange('GHOST')}
              icon={<Skull />}
              name="Ghost"
              desc="Hardcore Simulation"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button 
          onClick={handleStart}
          className="group relative px-12 py-4 bg-emerald-500 text-black font-bold uppercase tracking-[0.2em] rounded overflow-hidden hover:bg-emerald-400 transition-all active:scale-95"
        >
          <span className="relative z-10">Mulai Simulasi</span>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
        </button>

        <button 
          onClick={toggleAudio}
          className="flex items-center gap-2 text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {audioEnabled ? "AUDIO AKTIF" : "AUDIO NONAKTIF"}
        </button>
      </div>
    </div>
  );
}

function PlanetButton({ active, onClick, icon, name, desc }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 border rounded text-left transition-all ${active ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-emerald-900/30 text-emerald-900 hover:border-emerald-700'}`}
    >
      <div className="flex items-center gap-3">
        <div className={active ? 'text-emerald-500' : 'text-emerald-900'}>{icon}</div>
        <div>
          <div className="text-xs font-bold uppercase">{name}</div>
          <div className="text-[10px] opacity-70">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function DifficultyButton({ active, onClick, icon, name, desc }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 border rounded text-left transition-all ${active ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-emerald-900/30 text-emerald-900 hover:border-emerald-700'}`}
    >
      <div className="flex items-center gap-3">
        <div className={active ? 'text-emerald-500' : 'text-emerald-900'}>{icon}</div>
        <div>
          <div className="text-xs font-bold uppercase">{name}</div>
          <div className="text-[10px] opacity-70">{desc}</div>
        </div>
      </div>
    </button>
  );
}

function StatusItem({ icon, label, value, critical, color = 'bg-emerald-500' }: { icon: React.ReactNode, label: string, value: number, critical: boolean, color?: string }) {
  return (
    <div className="space-y-1">
      <div className={`flex justify-between text-[10px] font-bold ${critical ? 'text-red-500 animate-pulse' : 'opacity-70'}`}>
        <span className="flex items-center gap-1">{icon} {label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-emerald-950/50 rounded-full overflow-hidden border border-emerald-900/30">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${critical ? 'bg-red-600' : color}`}
        />
      </div>
    </div>
  );
}
