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

export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<PublicUser | null>(function () {
    return mockApi.auth.getCurrentUser();
  });

  const login = React.useCallback(function (email: string, senha: string) {
    const u = mockApi.auth.login(email, senha);
    setUser(u);
    return Promise.resolve();
  }, []);

  const logout = React.useCallback(function () {
    mockApi.auth.logout();
    setUser(null);
  }, []);

  const value = React.useMemo(function () {
    return { user: user, login: login, logout: logout };
  }, [user, login, logout]);

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function hasRole(user: PublicUser | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.indexOf(user.role) >= 0;
}
