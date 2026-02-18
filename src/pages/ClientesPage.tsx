import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Bairro, Cliente } from '../types/entities';

type FormState = Omit<Cliente, 'id'>;

export function ClientesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = React.useState<Cliente[]>([]);
  const [bairros, setBairros] = React.useState<Bairro[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Cliente | null>(null);
  const [form, setForm] = React.useState<FormState>({
    nome: '',
    telefone: '',
    email: '',
    bairroId: '',
    cadencia: 'diario',
    ativo: true,
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const refresh = React.useCallback(() => {
    if (!user) return;
    setRows(mockApi.clientes.list(user.id));
    setBairros(mockApi.lookups.listBairros());
  }, [user]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;
  const userId = user.id;

  const bairroName = (id: string) => bairros.find((b) => b.id === id)?.nome ?? id;

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.nome.trim()) e.nome = 'Obrigatório';
    if (!form.telefone.trim()) e.telefone = 'Obrigatório';
    if (!form.bairroId) e.bairroId = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function startCreate() {
    setEditing(null);
    setForm({ nome: '', telefone: '', email: '', bairroId: bairros[0]?.id ?? '', cadencia: 'diario', ativo: true });
    setErrors({});
    setOpen(true);
  }

  function startEdit(c: Cliente) {
    setEditing(c);
    setForm({
      nome: c.nome,
      telefone: c.telefone,
      email: c.email ?? '',
      bairroId: c.bairroId,
      cadencia: c.cadencia,
      ativo: c.ativo,
    });
    setErrors({});
    setOpen(true);
  }

  function onSave() {
    if (!validate()) return;
    try {
      const payload: Omit<Cliente, 'id'> = {
        nome: form.nome,
        telefone: form.telefone,
        email: form.email?.trim() ? form.email.trim() : undefined,
        bairroId: form.bairroId,
        cadencia: form.cadencia,
        ativo: form.ativo,
      };

      if (editing) {
        mockApi.clientes.update(userId, editing.id, payload);
        toast.show('Cliente atualizado', 'success');
      } else {
        mockApi.clientes.create(userId, payload);
        toast.show('Cliente criado', 'success');
      }
      setOpen(false);
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  function onDelete(c: Cliente) {
    if (!confirm(`Excluir cliente "${c.nome}"?`)) return;
    try {
      mockApi.clientes.delete(userId, c.id);
      toast.show('Excluído', 'success');
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Button variant="contained" onClick={startCreate}>
        Novo cliente
      </Button>

      <DataTable
        title="Clientes"
        rows={rows}
        columns={[
          { key: 'nome', header: 'Nome', render: (r) => r.nome },
          { key: 'telefone', header: 'Telefone', render: (r) => r.telefone },
          { key: 'email', header: 'Email', render: (r) => r.email ?? '-' },
          { key: 'bairro', header: 'Bairro', render: (r) => bairroName(r.bairroId) },
          { key: 'cadencia', header: 'Cadência', render: (r) => r.cadencia },
          { key: 'ativo', header: 'Ativo', render: (r) => (r.ativo ? 'Sim' : 'Não') },
        ]}
        onEdit={startEdit}
        onDelete={onDelete}
        getSearchText={(r) => `${r.nome} ${r.telefone} ${r.email ?? ''} ${bairroName(r.bairroId)}`}
      />

      <Modal
        open={open}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
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
          <FormField id="cli_nome" label="Nome" value={form.nome} onChange={(v) => setForm((s) => ({ ...s, nome: v }))} required error={errors.nome} />
          <FormField
            id="cli_tel"
            label="Telefone"
            value={form.telefone}
            onChange={(v) => setForm((s) => ({ ...s, telefone: v }))}
            required
            error={errors.telefone}
          />
          <FormField id="cli_email" label="Email (opcional)" value={form.email ?? ''} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />

          <FormControl fullWidth required error={Boolean(errors.bairroId)}>
            <InputLabel id="cli_bairro_label">Bairro</InputLabel>
            <Select
              labelId="cli_bairro_label"
              label="Bairro"
              value={form.bairroId}
              onChange={(e) => setForm((s) => ({ ...s, bairroId: e.target.value }))}
            >
              {bairros.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="cli_cad_label">Cadência</InputLabel>
            <Select
              labelId="cli_cad_label"
              label="Cadência"
              value={form.cadencia}
              onChange={(e) => setForm((s) => ({ ...s, cadencia: e.target.value as 'diario' | 'semanal' }))}
            >
              <MenuItem value="diario">diario</MenuItem>
              <MenuItem value="semanal">semanal</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Checkbox checked={form.ativo} onChange={(e) => setForm((s) => ({ ...s, ativo: e.target.checked }))} />}
            label="Ativo"
          />
        </Stack>
      </Modal>
    </Stack>
  );
}
