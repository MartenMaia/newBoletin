import {
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Drawer,
  Link as MuiLink,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { mockApi } from '../services/mockApi';

const drawerWidth = 260;

type NavItem = { label: string; to: string; roles: Array<'admin' | 'operador' | 'revisor'> };

const NAV: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', roles: ['admin', 'operador', 'revisor'] },
  { label: 'Minha Associação', to: '/app/minha-associacao', roles: ['admin', 'operador', 'revisor'] },
  { label: 'Bairros', to: '/app/bairros', roles: ['admin', 'operador', 'revisor'] },
  { label: 'Grupos', to: '/app/grupos', roles: ['admin'] },
  { label: 'Clientes', to: '/app/clientes', roles: ['admin', 'operador'] },
  { label: 'Boletins', to: '/app/boletins', roles: ['admin', 'operador', 'revisor'] },
  { label: 'Histórico de envios', to: '/app/historico-envios', roles: ['admin', 'operador', 'revisor'] },
  { label: 'Usuários', to: '/app/usuarios', roles: ['admin'] },
];

function useBreadcrumbs(pathname: string): Array<{ label: string; to?: string }> {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; to?: string }> = [{ label: 'App', to: '/app/dashboard' }];

  var acc = '';
  parts.slice(1).forEach(function (p) {
    acc += '/' + p;
    const label = p.replace(/-/g, ' ').replace(/\b\w/g, function (m) {
      return m.toUpperCase();
    });
    crumbs.push({ label: label, to: '/app' + acc });
  });

  if (crumbs.length > 0) crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label };
  return crumbs;
}

export function AppLayout() {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const crumbs = useBreadcrumbs(loc.pathname);

  React.useEffect(
    function () {
      if (!auth.user) return;
      function tick() {
        try {
          mockApi.scheduler.tick(auth.user ? auth.user.id : '');
        } catch {
          // ignore
        }
      }
      tick();
      const h = window.setInterval(tick, 30000);
      return function () {
        window.clearInterval(h);
      };
    },
    [auth.user],
  );

  if (!auth.user) return null;

  const items = NAV.filter(function (i) {
    return i.roles.indexOf(auth.user ? auth.user.role : 'operador') >= 0;
  });

  function handleLogout() {
    auth.logout();
    nav('/login');
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: function (t) {
        return t.zIndex.drawer + 1;
      } }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" component="div">
            newBoletin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" component="div" aria-label="Usuário logado">
              {auth.user.nome} ({auth.user.role})
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Sair
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          ['& .MuiDrawer-paper']: { width: drawerWidth, boxSizing: 'border-box' },
        }}
        aria-label="Menu lateral"
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {items.map(function (it) {
              return (
                <ListItemButton key={it.to} component={Link} to={it.to} selected={loc.pathname.startsWith(it.to)}>
                  <ListItemText primary={it.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          {crumbs.map(function (c, idx) {
            return c.to ? (
              <MuiLink key={idx} component={Link} to={c.to} underline="hover" color="inherit">
                {c.label}
              </MuiLink>
            ) : (
              <Typography key={idx} color="text.primary">
                {c.label}
              </Typography>
            );
          })}
        </Breadcrumbs>
        <Outlet />
      </Box>
    </Box>
  );
}
