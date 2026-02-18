import { Stack, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { DataTable } from '../components/DataTable';
import { mockApi } from '../services/mockApi';
import type { Boletim, EnvioLog } from '../types/entities';

export function HistoricoEnviosPage() {
  const { user } = useAuth();
  const [envios, setEnvios] = React.useState<EnvioLog[]>([]);
  const [boletins, setBoletins] = React.useState<Boletim[]>([]);

  React.useEffect(() => {
    if (!user) return;
    setEnvios(mockApi.envios.list(user.id));
    setBoletins(mockApi.boletins.list(user.id));
  }, [user]);

  if (!user) return null;

  const titleOf = (boletimId: string) => boletins.find((b) => b.id === boletimId)?.titulo ?? boletimId;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Histórico de envios
      </Typography>

      <DataTable
        rows={envios}
        columns={[
          {
            key: 'boletim',
            header: 'Boletim',
            render: (r) => (
              <Link to={`/app/boletins/${r.boletimId}`} style={{ color: 'inherit' }}>
                {titleOf(r.boletimId)}
              </Link>
            ),
          },
          { key: 'data', header: 'Data', render: (r) => new Date(r.data).toLocaleString() },
          { key: 'total', header: 'Total', render: (r) => r.total },
          { key: 'sucesso', header: 'Sucesso', render: (r) => r.sucesso },
          { key: 'falha', header: 'Falha', render: (r) => r.falha },
        ]}
        searchPlaceholder="Buscar envios"
        getSearchText={(r) => `${titleOf(r.boletimId)} ${r.total} ${r.sucesso} ${r.falha} ${r.data}`}
      />
    </Stack>
  );
}
