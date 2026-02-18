import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { AppLayout } from '../components/AppLayout';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MinhaAssociacaoPage } from '../pages/MinhaAssociacaoPage';
import { BairrosPage } from '../pages/BairrosPage';
import { UsuariosPage } from '../pages/UsuariosPage';
import { ClientesPage } from '../pages/ClientesPage';
import { GruposPage } from '../pages/GruposPage';
import { BoletinsConfigListPage } from '../pages/boletins/BoletinsConfigListPage';
import { BoletinsConfigNovoPage } from '../pages/boletins/BoletinsConfigNovoPage';
import { BoletinsConfigDetalhePage } from '../pages/boletins/BoletinsConfigDetalhePage';
import { BoletinsExecucaoPage } from '../pages/boletins/BoletinsExecucaoPage';
import { BoletinsExecucaoStandalonePage } from '../pages/boletins/BoletinsExecucaoStandalonePage';
import { HistoricoEnviosPage } from '../pages/HistoricoEnviosPage';

function RequireAuth(props: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.user) return <Navigate to="/login" replace />;
  return <>{props.children}</>;
}

function RequireRole(props: { roles: Array<'admin' | 'operador' | 'revisor'>; children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.user) return <Navigate to="/login" replace />;
  if (props.roles.indexOf(auth.user.role) < 0) return <Navigate to="/app/dashboard" replace />;
  return <>{props.children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

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

        <Route path="/app/minha-associacao" element={<MinhaAssociacaoPage />} />

        <Route
          path="/app/bairros"
          element={
            <RequireRole roles={['admin', 'operador', 'revisor']}>
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
          path="/app/grupos"
          element={
            <RequireRole roles={['admin']}>
              <GruposPage />
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

        <Route path="/app/boletins" element={<BoletinsConfigListPage />} />
        <Route
          path="/app/boletins/novo"
          element={
            <RequireRole roles={['admin']}>
              <BoletinsConfigNovoPage />
            </RequireRole>
          }
        />
        <Route path="/app/boletins/:configId" element={<BoletinsConfigDetalhePage />} />
        <Route path="/app/boletins/:configId/execucoes/:execId" element={<BoletinsExecucaoPage />} />
        <Route path="/app/boletins/execucoes/:execId" element={<BoletinsExecucaoStandalonePage />} />

        <Route path="/app/historico-envios" element={<HistoricoEnviosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
