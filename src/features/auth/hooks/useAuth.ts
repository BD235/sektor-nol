import { useState, useEffect, useCallback } from 'react';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface UseAuthReturn {
  user: User | null;
  authError: string | null;
  isAuthenticated: boolean;
  handleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleSkipLogin: () => void;
}

/**
 * Manages Firebase Google authentication state.
 * Provides login, logout, skip-login actions and tracks auth errors.
 */
export function useAuth(
  onAuthSuccess?: () => void,
  onLogoutSuccess?: () => void
): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        onAuthSuccess?.();
      }
    });
    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = useCallback(async () => {
    setAuthError(null);
    try {
      // [KOMENTAR AUTENTIKASI]
      // Menggunakan Firebase GoogleAuthProvider untuk memunculkan popup login Google.
      // Jika berhasil, 'onAuthStateChanged' di atas akan mendeteksi user baru dan mengupdate state.
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      console.error('Login failed', error);
      let errorMsg = 'Login gagal.';
      const firebaseError = error as { code?: string; message?: string };
      
      // [KOMENTAR ERROR HANDLING]
      // Firebase membuang berbagai macam kode error spesifik jika login gagal.
      // Kita menerjemahkan kode-kode ini menjadi pesan Bahasa Indonesia yang ramah pengguna.
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Login dibatalkan (Popup ditutup).';
      } else if (firebaseError.code === 'auth/cancelled-popup-request') {
        errorMsg = 'Permintaan login dibatalkan.';
      } else if (firebaseError.code === 'auth/popup-blocked') {
        errorMsg = 'Popup terblokir oleh browser.';
      } else {
        errorMsg = `Login gagal: ${firebaseError.message || 'Unknown error'}`;
      }
      setAuthError(errorMsg);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      onLogoutSuccess?.();
    } catch (error) {
      console.error('Logout failed', error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkipLogin = useCallback(() => {
    onAuthSuccess?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user,
    authError,
    isAuthenticated: user !== null,
    handleLogin,
    handleLogout,
    handleSkipLogin,
  };
}
