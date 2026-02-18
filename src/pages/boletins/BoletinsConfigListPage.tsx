import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/auth';
import { DataTable } from '../../components/DataTable';
import { useToast } from '../../app/toast';
import { mockApi } from '../../services/mockApi';
import type { BoletimConfig, BoletimConfigStatus, Cadencia, Grupo } from '../../types/entities';

export function BoletinsConfigListPage() {
  const auth = useAuth();
  const toast = useToast();

  const [rows, setRows] = React.useState<BoletimConfig[]>([]);
  const [grupos, setGrupos] = React.useState<Grupo[]>([]);

  const [status, setStatus] = React.useState<BoletimConfigStatus | 'todos'>('todos');
  const [tipo, setTipo] = React.useState<Cadencia | 'todos'>('todos');
  const [grupoId, setGrupoId] = React.useState<string | 'todos'>('todos');

  function refresh() {
    if (!auth.user) return;
    setRows(mockApi.boletinsConfig.list(auth.user.id, { status: status, tipo: tipo, grupoId: grupoId }));
    setGrupos(mockApi.lookups.listGrupos());
  }

  React.useEffect(
    function () {
      refresh();
    },
    [auth.user, status, tipo, grupoId],
  );

  if (!auth.user) return null;
  var userId = auth.user.id;

  function grupoName(id: string) {
    var g = grupos.find(function (x) {
      return x.id === id;
    });
    return g ? g.nome : id;
  }

  function onPauseResume(c: BoletimConfig) {
    try {
      if (c.status === 'ativo') {
        mockApi.boletinsConfig.pause(userId, c.id);
        toast.show('Config pausada', 'success');
      } else {
        mockApi.boletinsConfig.resume(userId, c.id);
        toast.show('Config ativada', 'success');
      }
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1">
          Boletins (Configurações)
        </Typography>
        {auth.user.role === 'admin' ? (
          <Button component={Link} to="/app/boletins/novo" variant="contained">
            Novo Boletim
          </Button>
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="f_status">Status</InputLabel>
          <Select labelId="f_status" label="Status" value={status} onChange={function (e) {
            setStatus(e.target.value as any);
          }}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="ativo">ativo</MenuItem>
            <MenuItem value="pausado">pausado</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="f_tipo">Tipo</InputLabel>
          <Select labelId="f_tipo" label="Tipo" value={tipo} onChange={function (e) {
            setTipo(e.target.value as any);
          }}>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="diario">diario</MenuItem>
            <MenuItem value="semanal">semanal</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="f_grupo">Grupo</InputLabel>
          <Select labelId="f_grupo" label="Grupo" value={grupoId} onChange={function (e) {
            setGrupoId(e.target.value as any);
          }}>
            <MenuItem value="todos">Todos</MenuItem>
            {grupos.map(function (g) {
              return (
                <MenuItem key={g.id} value={g.id}>
                  {g.nome}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      <DataTable
        rows={rows}
        columns={[
          { key: 'titulo', header: 'Título', render: function (r) {
            return (
              <Box component={Link} to={'/app/boletins/' + r.id} sx={{ textDecoration: 'none', color: 'primary.main' }}>
                {r.titulo}
              </Box>
            );
          } },
          { key: 'tipo', header: 'Periodicidade', render: function (r) {
            return r.periodicidade;
          } },
          { key: 'grupo', header: 'Grupo', render: function (r) {
            return grupoName(r.grupoId);
          } },
          { key: 'status', header: 'Status', render: function (r) {
            return r.status;
          } },
          { key: 'proximo', header: 'Próximo envio', render: function (r) {
            return new Date(r.proximoEnvioEm).toLocaleString();
          } },
          {
            key: 'acao',
            header: 'Ação',
            render: function (r) {
              return auth.user && auth.user.role === 'admin' ? (
                <Button size="small" variant="outlined" onClick={function () {
                  onPauseResume(r);
                }}>
                  {r.status === 'ativo' ? 'Pausar' : 'Ativar'}
                </Button>
              ) : (
                '-'
              );
            },
          },
        ]}
        searchPlaceholder="Buscar boletins"
        getSearchText={function (r) {
          return (r.titulo + ' ' + r.status + ' ' + r.periodicidade + ' ' + grupoName(r.grupoId)).trim();
        }}
      />
    </Stack>
  );
}
