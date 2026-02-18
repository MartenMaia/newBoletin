import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { mockApi } from '../services/mockApi';
import type { BoletimExecucao } from '../types/entities';

export function DashboardPage() {
  const auth = useAuth();
  const [execs, setExecs] = React.useState<BoletimExecucao[]>([]);

  React.useEffect(
    function () {
      if (!auth.user) return;

      // juntar execuções de todas configs
      var all: BoletimExecucao[] = [];
      mockApi.boletinsConfig.list(auth.user.id).forEach(function (c) {
        all = all.concat(mockApi.boletinsExecucoes.listByConfig(auth.user ? auth.user.id : '', c.id));
      });
      all.sort(function (a, b) {
        return b.geradoEm.localeCompare(a.geradoEm);
      });
      setExecs(all);
    },
    [auth.user],
  );

  if (!auth.user) return null;

  var pendentes = execs.filter(function (e) {
    return e.status === 'pendente_aprovacao';
  }).length;
  var aprovados = execs.filter(function (e) {
    return e.status === 'aprovado';
  }).length;
  var enviados = execs.filter(function (e) {
    return e.status === 'enviado';
  }).length;

  var ultimos = execs.slice(0, 5);

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1">
          Dashboard
        </Typography>
        {auth.user.role === 'admin' ? (
          <Button component={Link} to="/app/boletins/novo" variant="contained">
            Novo Boletim
          </Button>
        ) : null}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Card aria-label="Card pendentes">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Pendentes de aprovação
            </Typography>
            <Typography variant="h4">{pendentes}</Typography>
          </CardContent>
        </Card>
        <Card aria-label="Card aprovados">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Aprovados (aguardando envio)
            </Typography>
            <Typography variant="h4">{aprovados}</Typography>
          </CardContent>
        </Card>
        <Card aria-label="Card enviados">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Enviados
            </Typography>
            <Typography variant="h4">{enviados}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          Últimas execuções
        </Typography>
        <Stack spacing={1}>
          {ultimos.map(function (e) {
            return (
              <Box
                key={e.id}
                component={Link}
                to={'/app/boletins/execucoes/' + e.id}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main' },
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Execução {e.periodoLabel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Gerado em {new Date(e.geradoEm).toLocaleString()} • Status {e.status}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          {ultimos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhuma execução ainda.
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
}
