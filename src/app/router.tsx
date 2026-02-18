import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { AppLayout } from '../components/AppLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AssociacoesPage } from '../pages/AssociacoesPage';
import { BairrosPage } from '../pages/BairrosPage';
import { UsuariosPage } from '../pages/UsuariosPage';
import { ClientesPage } from '../pages/ClientesPage';
import { BoletinsListPage } from '../pages/BoletinsListPage';
import { BoletinsNovoPage } from '../pages/BoletinsNovoPage';
import { BoletimDetalhePage } from '../pages/BoletimDetalhePage';
import { HistoricoEnviosPage } from '../pages/HistoricoEnviosPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ roles, children }: { roles: Array<'admin' | 'operador' | 'validador'>; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app/dashboard" element={<DashboardPage />} />

        <Route
          path="/app/associacoes"
          element={
            <RequireRole roles={['admin']}>
              <AssociacoesPage />
            </RequireRole>
          }
        />
        <Route
          path="/app/bairros"
          element={
            <RequireRole roles={['admin']}>
              <BairrosPage />
            </RequireRole>
          }
        />
        <Route
          path="/app/usuarios"
          element={
            <RequireRole roles={['admin']}>
              <UsuariosPage />
            </RequireRole>
          }
        />
        <Route
          path="/app/clientes"
          element={
            <RequireRole roles={['admin', 'operador']}>
              <ClientesPage />
            </RequireRole>
          }
        />

        <Route path="/app/boletins" element={<BoletinsListPage />} />
        <Route
          path="/app/boletins/novo"
          element={
            <RequireRole roles={['admin', 'operador']}>
              <BoletinsNovoPage />
            </RequireRole>
          }
        />
        <Route path="/app/boletins/:id" element={<BoletimDetalhePage />} />

        <Route path="/app/historico-envios" element={<HistoricoEnviosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
