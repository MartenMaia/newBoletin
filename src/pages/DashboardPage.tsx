import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { mockApi } from '../services/mockApi';
import type { Boletim } from '../types/entities';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const { user } = useAuth();
  const [boletins, setBoletins] = React.useState<Boletim[]>([]);

  React.useEffect(() => {
    if (!user) return;
    setBoletins(mockApi.boletins.list(user.id));
  }, [user]);

  if (!user) return null;

  const pendentes = boletins.filter((b) => b.status === 'pendente_validacao').length;
  const aprovados = boletins.filter((b) => b.status === 'aprovado').length;
  const enviados = boletins.filter((b) => b.status === 'enviado').length;
  const ultimos = boletins.slice(0, 5);

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1">
          Dashboard
        </Typography>
        {(user.role === 'admin' || user.role === 'operador') && (
          <Button component={Link} to="/app/boletins/novo" variant="contained">
            Criar Boletim
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        <Card aria-label="Card pendentes">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Pendentes
            </Typography>
            <Typography variant="h4">{pendentes}</Typography>
          </CardContent>
        </Card>
        <Card aria-label="Card aprovados">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Aprovados
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
          Últimos boletins
        </Typography>
        <Stack spacing={1}>
          {ultimos.map((b) => (
            <Box
              key={b.id}
              component={Link}
              to={`/app/boletins/${b.id}`}
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
                  {b.titulo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Atualizado em {new Date(b.atualizadoEm).toLocaleString()}
                </Typography>
              </Box>
              <StatusBadge status={b.status} />
            </Box>
          ))}
          {ultimos.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nenhum boletim ainda.
            </Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
