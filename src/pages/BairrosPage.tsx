import { Button, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Associacao, Bairro } from '../types/entities';

type FormState = Omit<Bairro, 'id'>;

export function BairrosPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = React.useState<Bairro[]>([]);
  const [associacoes, setAssociacoes] = React.useState<Associacao[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Bairro | null>(null);
  const [form, setForm] = React.useState<FormState>({ nome: '', associacaoId: '' });
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const refresh = React.useCallback(() => {
    if (!user) return;
    setRows(mockApi.bairros.list(user.id));
    setAssociacoes(mockApi.lookups.listAssociacoes());
  }, [user]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;
  const userId = user.id;

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (!form.associacaoId) e.associacaoId = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function startCreate() {
    setEditing(null);
    setForm({ nome: '', associacaoId: associacoes[0]?.id ?? '' });
    setErrors({});
    setOpen(true);
  }

  function startEdit(b: Bairro) {
    setEditing(b);
    setForm({ nome: b.nome, associacaoId: b.associacaoId });
    setErrors({});
    setOpen(true);
  }

  function onSave() {
    if (!validate()) return;
    try {
      if (editing) {
        mockApi.bairros.update(userId, editing.id, form);
        toast.show('Bairro atualizado', 'success');
      } else {
        mockApi.bairros.create(userId, form);
        toast.show('Bairro criado', 'success');
      }
      setOpen(false);
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  function onDelete(b: Bairro) {
    if (!confirm(`Excluir bairro "${b.nome}"?`)) return;
    try {
      mockApi.bairros.delete(userId, b.id);
      toast.show('Excluído', 'success');
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  const assocName = (id: string) => associacoes.find((a) => a.id === id)?.nome ?? id;

  return (
    <Stack spacing={2}>
      <Button variant="contained" onClick={startCreate}>
        Novo bairro
      </Button>

      <DataTable
        title="Bairros"
        rows={rows}
        columns={[
          { key: 'nome', header: 'Nome', render: (r) => r.nome },
          { key: 'associacao', header: 'Associação', render: (r) => assocName(r.associacaoId) },
        ]}
        onEdit={startEdit}
        onDelete={onDelete}
        getSearchText={(r) => `${r.nome} ${assocName(r.associacaoId)}`}
      />

      <Modal
        open={open}
        title={editing ? 'Editar bairro' : 'Novo bairro'}
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={onSave}>
              Salvar
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormField id="bairro_nome" label="Nome" value={form.nome} onChange={(v) => setForm((s) => ({ ...s, nome: v }))} required error={errors.nome} />
          <FormControl fullWidth required error={Boolean(errors.associacaoId)}>
            <InputLabel id="bairro_assoc_label">Associação</InputLabel>
            <Select
              labelId="bairro_assoc_label"
              label="Associação"
              value={form.associacaoId}
              onChange={(e) => setForm((s) => ({ ...s, associacaoId: e.target.value }))}
              inputProps={{ 'aria-label': 'Associação' }}
            >
              {associacoes.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Modal>
    </Stack>
  );
}
