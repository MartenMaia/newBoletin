import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Bairro, BoletimItem, BoletimSecao, BoletimTipo } from '../types/entities';

type EditorItem = Omit<BoletimItem, 'id' | 'boletimId' | 'criadoEm'>;

function sectionLabel(s: BoletimSecao): string {
  if (s === 'seguranca') return 'Segurança';
  if (s === 'eventos') return 'Eventos';
  return 'Avisos';
}

export function BoletinsNovoPage() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [bairros, setBairros] = React.useState<Bairro[]>([]);

  const [titulo, setTitulo] = React.useState('');
  const [bairroId, setBairroId] = React.useState('');
  const [tipo, setTipo] = React.useState<BoletimTipo>('diario');

  const [itens, setItens] = React.useState<EditorItem[]>([
    { secao: 'seguranca', titulo: '', conteudo: '' },
  ]);

  const [errors, setErrors] = React.useState<{ titulo?: string; bairroId?: string }>(() => ({}));
  const [confirmSubmit, setConfirmSubmit] = React.useState(false);

  React.useEffect(() => {
    setBairros(mockApi.lookups.listBairros());
    const first = mockApi.lookups.listBairros()[0];
    if (first) setBairroId(first.id);
  }, []);

  if (!user) return null;
  const userId = user.id;

  const bairro = bairros.find((b) => b.id === bairroId);
  const associacaoId = bairro?.associacaoId;

  function validate(): boolean {
    const e: typeof errors = {};
    if (!titulo.trim()) e.titulo = 'Título é obrigatório';
    if (!bairroId) e.bairroId = 'Bairro é obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function cleanItens(): EditorItem[] {
    return itens
      .map((i) => ({ ...i, titulo: i.titulo.trim(), conteudo: i.conteudo.trim() }))
      .filter((i) => i.titulo || i.conteudo);
  }

  function addItem(secao: BoletimSecao) {
    setItens((prev) => [...prev, { secao, titulo: '', conteudo: '' }]);
  }

  function updateItem(idx: number, patch: Partial<EditorItem>) {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function createBoletim(): string {
    if (!associacaoId) throw new Error('Bairro inválido (sem associação)');
    const created = mockApi.boletins.create(userId, {
      titulo: titulo.trim(),
      bairroId,
      associacaoId,
      tipo,
      itens: cleanItens().map((i) => ({ secao: i.secao, titulo: i.titulo, conteudo: i.conteudo })),
    });
    return created.id;
  }

  function onSaveDraft() {
    if (!validate()) return;
    try {
      const id = createBoletim();
      toast.show('Rascunho salvo', 'success');
      nav(`/app/boletins/${id}`);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  function onSubmitForApproval() {
    if (!validate()) return;
    setConfirmSubmit(true);
  }

  function confirmAndSubmit() {
    try {
      const id = createBoletim();
      mockApi.boletins.submitForApproval(userId, id);
      toast.show('Enviado para validação', 'success');
      nav(`/app/boletins/${id}`);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    } finally {
      setConfirmSubmit(false);
    }
  }

  const sectionOrder: BoletimSecao[] = ['seguranca', 'eventos', 'avisos'];

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Novo boletim
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            error={Boolean(errors.titulo)}
            helperText={errors.titulo}
            inputProps={{ 'aria-label': 'Título do boletim' }}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 260 }} required error={Boolean(errors.bairroId)}>
              <InputLabel id="bairro_label">Bairro</InputLabel>
              <Select
                labelId="bairro_label"
                label="Bairro"
                value={bairroId}
                onChange={(e) => setBairroId(e.target.value)}
                inputProps={{ 'aria-label': 'Bairro' }}
              >
                {bairros.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="tipo_label">Tipo</InputLabel>
              <Select
                labelId="tipo_label"
                label="Tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as BoletimTipo)}
                inputProps={{ 'aria-label': 'Tipo' }}
              >
                <MenuItem value="diario">diario</MenuItem>
                <MenuItem value="semanal">semanal</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider />

          <Typography variant="h6" component="h2">
            Itens por seção
          </Typography>

          {sectionOrder.map((secao) => (
            <Box key={secao}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {sectionLabel(secao)}
                </Typography>
                <Button onClick={() => addItem(secao)} size="small" variant="outlined">
                  Adicionar item
                </Button>
              </Box>

              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {itens
                  .map((it, idx) => ({ it, idx }))
                  .filter((x) => x.it.secao === secao)
                  .map(({ it, idx }) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack spacing={1.5}>
                        <TextField
                          label="Título do item"
                          value={it.titulo}
                          onChange={(e) => updateItem(idx, { titulo: e.target.value })}
                          inputProps={{ 'aria-label': `Título do item (${sectionLabel(secao)})` }}
                          size="small"
                        />
                        <TextField
                          label="Conteúdo"
                          value={it.conteudo}
                          onChange={(e) => updateItem(idx, { conteudo: e.target.value })}
                          inputProps={{ 'aria-label': `Conteúdo do item (${sectionLabel(secao)})` }}
                          multiline
                          minRows={3}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button color="error" onClick={() => removeItem(idx)}>
                            Remover
                          </Button>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
              </Stack>
            </Box>
          ))}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={onSaveDraft}>
              Salvar rascunho
            </Button>
            <Button variant="contained" onClick={onSubmitForApproval}>
              Enviar para validação
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Modal
        open={confirmSubmit}
        title="Enviar para validação?"
        onClose={() => setConfirmSubmit(false)}
        actions={
          <>
            <Button onClick={() => setConfirmSubmit(false)}>Cancelar</Button>
            <Button variant="contained" onClick={confirmAndSubmit}>
              Confirmar envio
            </Button>
          </>
        }
      >
        <Typography variant="body2" color="text.secondary">
          Após enviar, o boletim ficará com status <strong>pendente_validacao</strong> e não poderá ser editado (MVP).
        </Typography>
      </Modal>
    </Stack>
  );
}
