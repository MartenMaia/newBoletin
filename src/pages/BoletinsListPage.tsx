import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { mockApi } from '../services/mockApi';
import type { Bairro, Boletim, BoletimStatus } from '../types/entities';

export function BoletinsListPage() {
  const { user } = useAuth();
  const [rows, setRows] = React.useState<Boletim[]>([]);
  const [bairros, setBairros] = React.useState<Bairro[]>([]);
  const [status, setStatus] = React.useState<BoletimStatus | 'todos'>('todos');
  const [bairroId, setBairroId] = React.useState<string | 'todos'>('todos');

  const refresh = React.useCallback(() => {
    if (!user) return;
    setRows(mockApi.boletins.list(user.id, { status, bairroId }));
    setBairros(mockApi.lookups.listBairros());
  }, [user, status, bairroId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;

  const bairroName = (id: string) => bairros.find((b) => b.id === id)?.nome ?? id;

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1">
          Boletins
        </Typography>
        {(user.role === 'admin' || user.role === 'operador') && (
          <Button component={Link} to="/app/boletins/novo" variant="contained">
            Novo boletim
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="filter_status">Status</InputLabel>
          <Select labelId="filter_status" label="Status" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="rascunho">rascunho</MenuItem>
            <MenuItem value="pendente_validacao">pendente_validacao</MenuItem>
            <MenuItem value="aprovado">aprovado</MenuItem>
            <MenuItem value="rejeitado">rejeitado</MenuItem>
            <MenuItem value="enviado">enviado</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="filter_bairro">Bairro</InputLabel>
          <Select labelId="filter_bairro" label="Bairro" value={bairroId} onChange={(e) => setBairroId(e.target.value as any)}>
            <MenuItem value="todos">Todos</MenuItem>
            {bairros.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <DataTable
        rows={rows}
        columns={[
          {
            key: 'titulo',
            header: 'Título',
            render: (r) => (
              <Box component={Link} to={`/app/boletins/${r.id}`} sx={{ textDecoration: 'none', color: 'primary.main' }}>
                {r.titulo}
              </Box>
            ),
          },
          { key: 'bairro', header: 'Bairro', render: (r) => bairroName(r.bairroId) },
          { key: 'tipo', header: 'Tipo', render: (r) => r.tipo },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'atualizado', header: 'Atualizado', render: (r) => new Date(r.atualizadoEm).toLocaleString() },
        ]}
        searchPlaceholder="Buscar boletins"
        getSearchText={(r) => `${r.titulo} ${bairroName(r.bairroId)} ${r.tipo} ${r.status}`}
      />
    </Stack>
  );
}
