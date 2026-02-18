import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { DataTable } from '../components/DataTable';
import { mockApi } from '../services/mockApi';
import type { Bairro } from '../types/entities';

export function BairrosPage() {
  const auth = useAuth();
  const [rows, setRows] = React.useState<Bairro[]>([]);

  React.useEffect(
    function () {
      if (!auth.user) return;
      setRows(mockApi.bairros.list(auth.user.id));
    },
    [auth.user],
  );

  if (!auth.user) return null;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" component="h1">
          Bairros
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bairros cadastrados e suportados.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Total: {rows.length}
        </Typography>
      </Box>

      <DataTable
        title="Lista de bairros"
        rows={rows}
        columns={[{ key: 'nome', header: 'Nome', render: function (r) {
          return r.nome;
        } }]}
        searchPlaceholder="Buscar bairro"
        getSearchText={function (r) {
          return r.nome;
        }}
      />
    </Stack>
  );
}
