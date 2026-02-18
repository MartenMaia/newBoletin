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
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { mockApi } from '../services/mockApi';
import type { Boletim, BoletimItem, BoletimSecao } from '../types/entities';

function secaoLabel(s: BoletimSecao): string {
  if (s === 'seguranca') return 'Segurança';
  if (s === 'eventos') return 'Eventos';
  return 'Avisos';
}

export function BoletimDetalhePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [boletim, setBoletim] = React.useState<Boletim | null>(null);
  const [itens, setItens] = React.useState<BoletimItem[]>([]);

  const [approveOpen, setApproveOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [motivo, setMotivo] = React.useState('');

  const refresh = React.useCallback(() => {
    if (!user || !id) return;
    const res = mockApi.boletins.getById(user.id, id);
    setBoletim(res.boletim);
    setItens(res.itens);
  }, [user, id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user || !id) return null;
  const userId = user.id;
  const boletimId = id;
  if (!boletim) return null;

  const canValidate = user.role === 'validador' && user.associacaoId === boletim.associacaoId && boletim.status === 'pendente_validacao';
  const canSend = (user.role === 'admin' || user.role === 'operador') && boletim.status === 'aprovado';

  const group = (secao: BoletimSecao) => itens.filter((i) => i.secao === secao);

  function approve() {
    try {
      mockApi.boletins.approve(userId, boletimId, userId);
      toast.show('Boletim aprovado', 'success');
      setApproveOpen(false);
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  function reject() {
    if (!motivo.trim()) {
      toast.show('Informe um motivo', 'warning');
      return;
    }
    try {
      mockApi.boletins.reject(userId, boletimId, userId, motivo.trim());
      toast.show('Boletim rejeitado', 'success');
      setRejectOpen(false);
      setMotivo('');
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  function send() {
    try {
      const res = mockApi.boletins.send(userId, boletimId);
      toast.show(`Disparo simulado: ${res.log.sucesso}/${res.log.total} sucesso`, 'success');
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" component="h1">
            {boletim.titulo}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={boletim.status} />
            <Typography variant="caption" color="text.secondary">
              Criado em {new Date(boletim.criadoEm).toLocaleString()} • Atualizado em {new Date(boletim.atualizadoEm).toLocaleString()}
            </Typography>
          </Box>
          {boletim.status === 'rejeitado' && boletim.rejeitadoMotivo ? (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Rejeitado: {boletim.rejeitadoMotivo}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button component={Link} to="/app/boletins" variant="outlined">
            Voltar
          </Button>
          {canValidate ? (
            <>
              <Button color="error" variant="outlined" onClick={() => setRejectOpen(true)}>
                Rejeitar
              </Button>
              <Button variant="contained" onClick={() => setApproveOpen(true)}>
                Aprovar
              </Button>
            </>
          ) : null}
          {canSend ? (
            <Button variant="contained" onClick={send}>
              Disparar
            </Button>
          ) : null}
        </Box>
      </Box>

      <Paper sx={{ p: 2 }} aria-label="Preview do boletim">
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          Preview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tipo: <strong>{boletim.tipo}</strong>
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {(['seguranca', 'eventos', 'avisos'] as BoletimSecao[]).map((secao) => (
          <Box key={secao} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {secaoLabel(secao)}
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {group(secao).map((it) => (
                <Paper key={it.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {it.titulo || '(sem título)'}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {it.conteudo || '(sem conteúdo)'}
                  </Typography>
                </Paper>
              ))}
              {group(secao).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sem itens.
                </Typography>
              ) : null}
            </Stack>
          </Box>
        ))}
      </Paper>

      <Modal
        open={approveOpen}
        title="Aprovar boletim?"
        onClose={() => setApproveOpen(false)}
        actions={
          <>
            <Button onClick={() => setApproveOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={approve}>
              Confirmar aprovação
            </Button>
          </>
        }
      >
        <Typography variant="body2" color="text.secondary">
          Ao aprovar, o boletim ficará com status <strong>aprovado</strong>.
        </Typography>
      </Modal>

      <Modal
        open={rejectOpen}
        title="Rejeitar boletim"
        onClose={() => setRejectOpen(false)}
        actions={
          <>
            <Button onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={reject}>
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
            onChange={(e) => setMotivo(e.target.value)}
            multiline
            minRows={3}
            inputProps={{ 'aria-label': 'Motivo da rejeição' }}
          />
        </Stack>
      </Modal>
    </Stack>
  );
}
