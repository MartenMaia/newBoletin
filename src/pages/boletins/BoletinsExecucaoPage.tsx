import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../app/auth';
import { useToast } from '../../app/toast';
import { Modal } from '../../components/Modal';
import { mockApi } from '../../services/mockApi';
import type { BoletimItemExecucao, BoletimSecao } from '../../types/entities';

type EditItem = Omit<BoletimItemExecucao, 'id' | 'boletimExecucaoId' | 'criadoEm'>;

function secaoLabel(s: BoletimSecao): string {
  if (s === 'seguranca') return 'Segurança';
  if (s === 'eventos') return 'Eventos';
  return 'Avisos';
}

export function BoletinsExecucaoPage() {
  const auth = useAuth();
  const toast = useToast();
  // navigation not needed here
  const params = useParams();

  const [exec, setExec] = React.useState<any>(null);
  const [config, setConfig] = React.useState<any>(null);
  const [itens, setItens] = React.useState<EditItem[]>([]);

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [motivo, setMotivo] = React.useState('');

  function refresh() {
    if (!auth.user) return;
    if (!params.execId) return;
    var res = mockApi.boletinsExecucoes.get(auth.user.id, params.execId);
    setExec(res.execucao);
    setConfig(res.config);
    setItens(
      res.itens.map(function (it: BoletimItemExecucao) {
        return { secao: it.secao, titulo: it.titulo, conteudo: it.conteudo };
      }),
    );
  }

  React.useEffect(
    function () {
      refresh();
    },
    [auth.user, params.execId],
  );

  if (!auth.user) return null;
  if (!params.execId) return null;
  if (!exec || !config) return null;

  var canEdit = (auth.user.role === 'admin' || auth.user.role === 'operador') && exec.status === 'pendente_aprovacao';
  var canApproveReject =
    exec.status === 'pendente_aprovacao' &&
    (auth.user.role === 'admin' || (auth.user.role === 'revisor' && config.revisorUserId === auth.user.id));
  var canSend = auth.user.role === 'admin' && exec.status === 'aprovado';

  function updateItem(idx: number, patch: Partial<EditItem>) {
    setItens(
      itens.map(function (it, i) {
        return i === idx ? { ...it, ...patch } : it;
      }),
    );
  }

  function addItem(secao: BoletimSecao) {
    setItens(itens.concat([{ secao: secao, titulo: '', conteudo: '' }]));
  }

  function removeItem(idx: number) {
    setItens(
      itens.filter(function (_, i) {
        return i !== idx;
      }),
    );
  }

  function onSaveItens() {
    if (!auth.user) return;
    if (!params.execId) return;
    try {
      mockApi.boletinsExecucoes.updateItens(auth.user.id, params.execId, itens);
      toast.show('Itens salvos', 'success');
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  function onApprove() {
    if (!auth.user) return;
    if (!params.execId) return;
    try {
      mockApi.boletinsExecucoes.approve(auth.user.id, params.execId);
      toast.show('Aprovado', 'success');
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  function onRejectConfirm() {
    if (!auth.user) return;
    if (!params.execId) return;
    if (!motivo.trim()) {
      toast.show('Informe um motivo', 'warning');
      return;
    }
    try {
      mockApi.boletinsExecucoes.reject(auth.user.id, params.execId, motivo.trim());
      toast.show('Rejeitado', 'success');
      setRejectOpen(false);
      setMotivo('');
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  function onSend() {
    if (!auth.user) return;
    if (!params.execId) return;
    try {
      var res = mockApi.boletinsExecucoes.send(auth.user.id, params.execId);
      toast.show('Enviado: ' + String(res.resumo.sucesso) + '/' + String(res.resumo.total), 'success');
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" component="h1">
            Execução {exec.periodoLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Status: <strong>{exec.status}</strong> • Config: <strong>{config.titulo}</strong>
          </Typography>
        </Box>
        <Button component={Link} to={'/app/boletins/' + config.id} variant="outlined">
          Voltar
        </Button>
      </Box>

      {exec.motivo ? (
        <Paper sx={{ p: 2 }}>
          <Typography color="error">Motivo da rejeição: {exec.motivo}</Typography>
        </Paper>
      ) : null}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Conteúdo</Typography>
          <Divider />

          {(['seguranca', 'eventos', 'avisos'] as BoletimSecao[]).map(function (secao) {
            return (
              <Box key={secao}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {secaoLabel(secao)}
                  </Typography>
                  {canEdit ? (
                    <Button size="small" variant="outlined" onClick={function () {
                      addItem(secao);
                    }}>
                      Adicionar item
                    </Button>
                  ) : null}
                </Box>

                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {itens
                    .map(function (it, idx) {
                      return { it: it, idx: idx };
                    })
                    .filter(function (x) {
                      return x.it.secao === secao;
                    })
                    .map(function (x) {
                      return (
                        <Paper key={x.idx} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack spacing={1.5}>
                            <TextField
                              label="Título"
                              value={x.it.titulo}
                              onChange={function (e) {
                                updateItem(x.idx, { titulo: e.target.value });
                              }}
                              disabled={!canEdit}
                              size="small"
                            />
                            <TextField
                              label="Conteúdo"
                              value={x.it.conteudo}
                              onChange={function (e) {
                                updateItem(x.idx, { conteudo: e.target.value });
                              }}
                              disabled={!canEdit}
                              multiline
                              minRows={3}
                            />
                            {canEdit ? (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button color="error" onClick={function () {
                                  removeItem(x.idx);
                                }}>
                                  Remover
                                </Button>
                              </Box>
                            ) : null}
                          </Stack>
                        </Paper>
                      );
                    })}
                </Stack>
              </Box>
            );
          })}

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {canEdit ? (
              <Button variant="outlined" onClick={onSaveItens}>
                Salvar itens
              </Button>
            ) : null}
            {canApproveReject ? (
              <>
                <Button color="error" variant="outlined" onClick={function () {
                  setRejectOpen(true);
                }}>
                  Rejeitar
                </Button>
                <Button variant="contained" onClick={onApprove}>
                  Aprovar
                </Button>
              </>
            ) : null}
            {canSend ? (
              <Button variant="contained" onClick={onSend}>
                Enviar
              </Button>
            ) : null}
          </Box>
        </Stack>
      </Paper>

      <Modal
        open={rejectOpen}
        title="Rejeitar execução"
        onClose={function () {
          setRejectOpen(false);
        }}
        actions={
          <>
            <Button
              onClick={function () {
                setRejectOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={onRejectConfirm}>
              Confirmar rejeição
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Informe um motivo (obrigatório).
          </Typography>
          <TextField
            label="Motivo"
            value={motivo}
            onChange={function (e) {
              setMotivo(e.target.value);
            }}
            multiline
            minRows={3}
            inputProps={{ 'aria-label': 'Motivo da rejeição' }}
          />
        </Stack>
      </Modal>
    </Stack>
  );
}
