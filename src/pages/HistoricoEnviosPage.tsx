import { Stack, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { DataTable } from '../components/DataTable';
import { mockApi } from '../services/mockApi';
import type { EnvioResumoLog } from '../types/entities';

export function HistoricoEnviosPage() {
  const auth = useAuth();
  const [envios, setEnvios] = React.useState<EnvioResumoLog[]>([]);

  React.useEffect(
    function () {
      if (!auth.user) return;
      setEnvios(mockApi.envios.listResumo(auth.user.id));
    },
    [auth.user],
  );

  if (!auth.user) return null;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Histórico de envios
      </Typography>

      <DataTable
        rows={envios}
        columns={[
          {
            key: 'exec',
            header: 'Execução',
            render: function (r) {
              return (
                <Link to={'/app/boletins/execucoes/' + r.boletimExecucaoId} style={{ color: 'inherit' }}>
                  {r.boletimExecucaoId}
                </Link>
              );
            },
          },
          { key: 'data', header: 'Data', render: function (r) {
            return new Date(r.data).toLocaleString();
          } },
          { key: 'total', header: 'Total', render: function (r) {
            return r.total;
          } },
          { key: 'sucesso', header: 'Sucesso', render: function (r) {
            return r.sucesso;
          } },
          { key: 'falha', header: 'Falha', render: function (r) {
            return r.falha;
          } },
        ]}
        searchPlaceholder="Buscar envios"
        getSearchText={function (r) {
          return (r.boletimExecucaoId + ' ' + String(r.total) + ' ' + String(r.sucesso) + ' ' + String(r.falha) + ' ' + r.data).trim();
        }}
      />
    </Stack>
  );
}
