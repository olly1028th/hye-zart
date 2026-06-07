import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isSupabaseMode: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithKakao: () => Promise<void>;
  loginAsTestUser: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TEST_USER: User = {
  id: 'test-user-001',
  name: '테스트 유저',
  email: 'test@piano.app',
  provider: 'test',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar_url,
            provider: 'supabase',
          });
        } else {
          restoreLocalUser();
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar_url,
            provider: 'supabase',
          });
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      restoreLocalUser();
      setLoading(false);
    }
  }, []);

  function restoreLocalUser() {
    const saved = localStorage.getItem('piano-auth-user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { setUser(null); }
    }
  }

  async function loginWithGoogle() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function loginWithKakao() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin },
    });
  }

  function loginAsTestUser() {
    setUser(TEST_USER);
    localStorage.setItem('piano-auth-user', JSON.stringify(TEST_USER));
  }

  async function logout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('piano-auth-user');
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggedIn: !!user,
      isSupabaseMode: isSupabaseConfigured,
      loginWithGoogle,
      loginWithKakao,
      loginAsTestUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
