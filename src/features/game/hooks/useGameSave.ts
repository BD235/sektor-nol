import { useState, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import type { GameState } from '@/lib/types';

interface UseGameSaveReturn {
  isSaving: boolean;
  handleSaveGame: (gameData: GameState) => Promise<void>;
  handleLoadGame: () => Promise<GameState | null>;
}

/**
 * Manages Firestore save/load operations for game state.
 * Requires an authenticated user — operations no-op if not logged in.
 */
export function useGameSave(): UseGameSaveReturn {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveGame = useCallback(async (gameData: GameState) => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    
    // [KOMENTAR PENYIMPANAN FIREBASE]
    // Kita menggunakan UID user sebagai nama dokumen. 
    // Ini menjamin bahwa user hanya memiliki 1 slot save data, dan terisolasi dari user lain.
    const path = `saves/${auth.currentUser.uid}`;
    try {
      // Menggabungkan data game terbaru dengan UID dan timestamp server untuk keperluan sinkronisasi.
      await setDoc(doc(db, path), {
        ...gameData,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleLoadGame = useCallback(async (): Promise<GameState | null> => {
    if (!auth.currentUser) return null;
    const path = `saves/${auth.currentUser.uid}`;
    try {
      const docSnap = await getDoc(doc(db, path));
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        return {
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
          signalProgress: data.signalProgress || 0,
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }, []);

  return { isSaving, handleSaveGame, handleLoadGame };
}
