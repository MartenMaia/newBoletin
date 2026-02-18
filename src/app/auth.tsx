import React from 'react';
import type { Role, Usuario } from '../types/entities';
import { mockApi } from '../services/mockApi';

export type PublicUser = Omit<Usuario, 'senha'>;

interface AuthState {
  user: PublicUser | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<PublicUser | null>(() => mockApi.auth.getCurrentUser());

  const login = React.useCallback(async (email: string, senha: string) => {
    const u = mockApi.auth.login(email, senha);
    setUser(u);
  }, []);

  const logout = React.useCallback(() => {
    mockApi.auth.logout();
    setUser(null);
  }, []);

  const value = React.useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function hasRole(user: PublicUser | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
