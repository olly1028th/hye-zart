import { createContext, useContext, useState, type ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TEST_USER: User = {
  id: 'test-user-001',
  name: '테스트 유저',
  email: 'test@piano.app',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('piano-auth-user');
    return saved ? JSON.parse(saved) : TEST_USER;
  });

  function login(u: User) {
    setUser(u);
    localStorage.setItem('piano-auth-user', JSON.stringify(u));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('piano-auth-user');
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
