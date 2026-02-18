import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../app/auth';
import { mockApi } from '../../services/mockApi';
import { DataTable } from '../../components/DataTable';
import type { BoletimConfig, BoletimExecucao, Grupo, Usuario } from '../../types/entities';

export function BoletinsConfigDetalhePage() {
  const auth = useAuth();
  const params = useParams();

  const [config, setConfig] = React.useState<BoletimConfig | null>(null);
  const [execs, setExecs] = React.useState<BoletimExecucao[]>([]);
  const [grupos, setGrupos] = React.useState<Grupo[]>([]);
  const [users, setUsers] = React.useState<Array<Omit<Usuario, 'senha'>>>([]);

  function refresh() {
    if (!auth.user) return;
    if (!params.configId) return;
    var res = mockApi.boletinsConfig.get(auth.user.id, params.configId);
    setConfig(res.config);
    setExecs(mockApi.boletinsExecucoes.listByConfig(auth.user.id, params.configId));
    setGrupos(mockApi.lookups.listGrupos());
    setUsers(mockApi.lookups.listUsuariosPublicos());
  }

  React.useEffect(
    function () {
      refresh();
    },
    [auth.user, params.configId],
  );

  if (!auth.user) return null;
  if (!params.configId) return null;
  if (!config) return null;

  function grupoName(id: string) {
    var g = grupos.find(function (x) {
      return x.id === id;
    });
    return g ? g.nome : id;
  }

  function userName(id: string) {
    var u = users.find(function (x) {
      return x.id === id;
    });
    return u ? u.nome : id;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1">
          {config.titulo}
        </Typography>
        <Button component={Link} to="/app/boletins" variant="outlined">
          Voltar
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Grupo: <strong>{grupoName(config.grupoId)}</strong> • Revisor: <strong>{userName(config.revisorUserId)}</strong> • Status:{' '}
          <strong>{config.status}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Próximo envio em <strong>{new Date(config.proximoEnvioEm).toLocaleString()}</strong>
        </Typography>
      </Paper>

      <DataTable
        title="Execuções"
        rows={execs}
        columns={[
          { key: 'geradoEm', header: 'Gerado em', render: function (r) {
            return new Date(r.geradoEm).toLocaleString();
          } },
          { key: 'periodo', header: 'Período', render: function (r) {
            return r.periodoLabel;
          } },
          { key: 'status', header: 'Status', render: function (r) {
            return r.status;
          } },
          {
            key: 'acao',
            header: 'Ações',
            render: function (r) {
              return (
                <Button size="small" component={Link} to={'/app/boletins/' + params.configId + '/execucoes/' + r.id} variant="outlined">
                  Ver
                </Button>
              );
            },
          },
        ]}
        searchPlaceholder="Buscar execuções"
        getSearchText={function (r) {
          return (r.periodoLabel + ' ' + r.status + ' ' + r.geradoEm).trim();
        }}
      />
    </Stack>
  );
}
