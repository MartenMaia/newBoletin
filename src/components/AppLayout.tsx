import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { mockApi } from '../services/mockApi';

const drawerWidth = 280;

type Role = 'admin' | 'operador' | 'revisor';

type NavItem = { label: string; to: string; roles: Role[] };

type NavGroup = { key: string; label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'principal',
    label: 'Principal',
    items: [
      { label: 'Dashboard', to: '/app/dashboard', roles: ['admin', 'operador', 'revisor'] },
      { label: 'Clientes', to: '/app/clientes', roles: ['admin', 'operador'] },
    ],
  },
  {
    key: 'config',
    label: 'Configurações',
    items: [
      { label: 'Minha Associação', to: '/app/minha-associacao', roles: ['admin', 'operador', 'revisor'] },
      { label: 'Usuários', to: '/app/usuarios', roles: ['admin'] },
      { label: 'Bairros', to: '/app/bairros', roles: ['admin', 'operador', 'revisor'] },
    ],
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    items: [
      { label: 'Boletins', to: '/app/boletins', roles: ['admin', 'operador', 'revisor'] },
      { label: 'Histórico de envios', to: '/app/historico-envios', roles: ['admin', 'operador', 'revisor'] },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    items: [{ label: 'Grupos', to: '/app/grupos', roles: ['admin'] }],
  },
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

function storageKey(): string {
  return 'newboletin.nav.accordions.v1';
}

function loadExpanded(): string[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return ['principal'];
    const val = JSON.parse(raw) as unknown;
    if (!Array.isArray(val)) return ['principal'];
    return val.filter(function (x) {
      return typeof x === 'string';
    });
  } catch {
    return ['principal'];
  }
}

function saveExpanded(keys: string[]): void {
  localStorage.setItem(storageKey(), JSON.stringify(keys));
}

export function AppLayout() {
  const auth = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const crumbs = useBreadcrumbs(loc.pathname);

  const [expanded, setExpanded] = React.useState<string[]>(function () {
    return loadExpanded();
  });

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

  function handleLogout() {
    auth.logout();
    nav('/login');
  }

  function canSee(item: NavItem): boolean {
    return item.roles.indexOf(auth.user ? (auth.user.role as Role) : 'operador') >= 0;
  }

  function isExpanded(key: string): boolean {
    return expanded.indexOf(key) >= 0;
  }

  function toggleAccordion(key: string): void {
    var next: string[];
    if (isExpanded(key)) {
      next = expanded.filter(function (k) {
        return k !== key;
      });
    } else {
      next = expanded.concat([key]);
    }
    setExpanded(next);
    saveExpanded(next);
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: function (t) {
            return t.zIndex.drawer + 1;
          },
        }}
      >
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
        <Box sx={{ overflow: 'auto', px: 1, py: 1 }}>
          {NAV_GROUPS.map(function (group) {
            var visible = group.items.filter(canSee);
            if (visible.length === 0) return null;

            return (
              <Accordion
                key={group.key}
                expanded={isExpanded(group.key)}
                onChange={function () {
                  toggleAccordion(group.key);
                }}
                disableGutters
                elevation={0}
                sx={{
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={group.key + '-content'} id={group.key + '-header'}>
                  <Typography variant="subtitle2">{group.label}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List dense aria-label={group.label + ' submenu'}>
                    {visible.map(function (it) {
                      return (
                        <ListItemButton key={it.to} component={Link} to={it.to} selected={loc.pathname.startsWith(it.to)}>
                          <ListItemText primary={it.label} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </AccordionDetails>
              </Accordion>
            );
          })}
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
