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
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth';

const drawerWidth = 240;

type NavItem = { label: string; to: string; roles: Array<'admin' | 'operador' | 'validador'> };

const NAV: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', roles: ['admin', 'operador', 'validador'] },
  { label: 'Boletins', to: '/app/boletins', roles: ['admin', 'operador', 'validador'] },
  { label: 'Histórico de envios', to: '/app/historico-envios', roles: ['admin', 'operador', 'validador'] },
  { label: 'Clientes', to: '/app/clientes', roles: ['admin', 'operador'] },
  { label: 'Associações', to: '/app/associacoes', roles: ['admin'] },
  { label: 'Bairros', to: '/app/bairros', roles: ['admin'] },
  { label: 'Usuários', to: '/app/usuarios', roles: ['admin'] },
];

function useBreadcrumbs(pathname: string): Array<{ label: string; to?: string }> {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; to?: string }> = [{ label: 'App', to: '/app/dashboard' }];

  let acc = '';
  for (const p of parts.slice(1)) {
    acc += `/${p}`;
    const label = p
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
    crumbs.push({ label, to: `/app${acc}` });
  }
  // último não precisa ter link
  if (crumbs.length > 0) crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label };
  return crumbs;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const crumbs = useBreadcrumbs(loc.pathname);

  if (!user) return null;

  const items = NAV.filter((i) => i.roles.includes(user.role));

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" component="div">
            newBoletin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" component="div" aria-label="Usuário logado">
              {user.nome} ({user.role})
            </Typography>
            <Button
              color="inherit"
              onClick={() => {
                logout();
                nav('/login');
              }}
            >
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
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
        aria-label="Menu lateral"
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {items.map((it) => (
              <ListItemButton
                key={it.to}
                component={Link}
                to={it.to}
                selected={loc.pathname.startsWith(it.to)}
              >
                <ListItemText primary={it.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          {crumbs.map((c, idx) =>
            c.to ? (
              <MuiLink key={idx} component={Link} to={c.to} underline="hover" color="inherit">
                {c.label}
              </MuiLink>
            ) : (
              <Typography key={idx} color="text.primary">
                {c.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
        <Outlet />
      </Box>
    </Box>
  );
}
