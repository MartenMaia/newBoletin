import { Button, Checkbox, FormControlLabel, Stack } from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Associacao } from '../types/entities';

type FormState = Omit<Associacao, 'id'>;

const empty: FormState = {
  nome: '',
  responsavel: '',
  telefone: '',
  email: '',
  podeAprovar: true,
};

export function AssociacoesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = React.useState<Associacao[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Associacao | null>(null);
  const [form, setForm] = React.useState<FormState>(empty);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const refresh = React.useCallback(() => {
    if (!user) return;
    setRows(mockApi.associacoes.list(user.id));
  }, [user]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;
  const userId = user.id;

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (!form.responsavel.trim()) e.responsavel = 'Obrigatório';
    if (!form.telefone.trim()) e.telefone = 'Obrigatório';
    if (!form.email.trim()) e.email = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function startCreate() {
    setEditing(null);
    setForm(empty);
    setErrors({});
    setOpen(true);
  }

  function startEdit(a: Associacao) {
    setEditing(a);
    setForm({
      nome: a.nome,
      responsavel: a.responsavel,
      telefone: a.telefone,
      email: a.email,
      podeAprovar: a.podeAprovar,
    });
    setErrors({});
    setOpen(true);
  }

  function onSave() {
    if (!validate()) return;
    try {
      if (editing) {
        mockApi.associacoes.update(userId, editing.id, form);
        toast.show('Associação atualizada', 'success');
      } else {
        mockApi.associacoes.create(userId, form);
        toast.show('Associação criada', 'success');
      }
      setOpen(false);
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  function onDelete(a: Associacao) {
    if (!confirm(`Excluir associação "${a.nome}"?`)) return;
    try {
      mockApi.associacoes.delete(userId, a.id);
      toast.show('Excluída', 'success');
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Button variant="contained" onClick={startCreate}>
        Nova associação
      </Button>

      <DataTable
        title="Associações"
        rows={rows}
        columns={[
          { key: 'nome', header: 'Nome', render: (r) => r.nome },
          { key: 'responsavel', header: 'Responsável', render: (r) => r.responsavel },
          { key: 'telefone', header: 'Telefone', render: (r) => r.telefone },
          { key: 'email', header: 'Email', render: (r) => r.email },
          { key: 'podeAprovar', header: 'Pode aprovar', render: (r) => (r.podeAprovar ? 'Sim' : 'Não') },
        ]}
        onEdit={startEdit}
        onDelete={onDelete}
        getSearchText={(r) => `${r.nome} ${r.responsavel} ${r.telefone} ${r.email}`}
      />

      <Modal
        open={open}
        title={editing ? 'Editar associação' : 'Nova associação'}
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
          <FormField id="assoc_nome" label="Nome" value={form.nome} onChange={(v) => setForm((s) => ({ ...s, nome: v }))} required error={errors.nome} />
          <FormField
            id="assoc_resp"
            label="Responsável"
            value={form.responsavel}
            onChange={(v) => setForm((s) => ({ ...s, responsavel: v }))}
            required
            error={errors.responsavel}
          />
          <FormField
            id="assoc_tel"
            label="Telefone"
            value={form.telefone}
            onChange={(v) => setForm((s) => ({ ...s, telefone: v }))}
            required
            error={errors.telefone}
          />
          <FormField id="assoc_email" label="Email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} required error={errors.email} />
          <FormControlLabel
            control={<Checkbox checked={form.podeAprovar} onChange={(e) => setForm((s) => ({ ...s, podeAprovar: e.target.checked }))} />}
            label="Associação pode aprovar"
          />
        </Stack>
      </Modal>
    </Stack>
  );
}
