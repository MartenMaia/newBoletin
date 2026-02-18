import { Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Associacao, Role, Usuario } from '../types/entities';

type PublicUser = Omit<Usuario, 'senha'>;

type FormState = {
  nome: string;
  email: string;
  senha: string;
  role: Role;
  associacaoId?: string;
};

export function UsuariosPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = React.useState<PublicUser[]>([]);
  const [associacoes, setAssociacoes] = React.useState<Associacao[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PublicUser | null>(null);
  const [form, setForm] = React.useState<FormState>({ nome: '', email: '', senha: '', role: 'operador', associacaoId: undefined });
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  const refresh = React.useCallback(() => {
    if (!user) return;
    setRows(mockApi.usuarios.list(user.id));
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
    if (!form.email.trim()) e.email = 'Obrigatório';
    if (!editing && !form.senha.trim()) e.senha = 'Obrigatório';
    if (form.role === 'validador' && !form.associacaoId) e.associacaoId = 'Obrigatório para validador';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function startCreate() {
    setEditing(null);
    setForm({ nome: '', email: '', senha: '', role: 'operador', associacaoId: associacoes[0]?.id });
    setErrors({});
    setOpen(true);
  }

  function startEdit(u: PublicUser) {
    setEditing(u);
    setForm({ nome: u.nome, email: u.email, senha: '', role: u.role, associacaoId: u.associacaoId });
    setErrors({});
    setOpen(true);
  }

  function onSave() {
    if (!validate()) return;
    try {
      if (editing) {
        mockApi.usuarios.update(userId, editing.id, {
          nome: form.nome,
          email: form.email,
          role: form.role,
          associacaoId: form.role === 'validador' ? form.associacaoId : undefined,
          ...(form.senha.trim() ? { senha: form.senha } : {}),
        });
        toast.show('Usuário atualizado', 'success');
      } else {
        mockApi.usuarios.create(userId, {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          role: form.role,
          associacaoId: form.role === 'validador' ? form.associacaoId : undefined,
        });
        toast.show('Usuário criado', 'success');
      }
      setOpen(false);
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  function onDelete(u: PublicUser) {
    if (!confirm(`Excluir usuário "${u.nome}"?`)) return;
    try {
      mockApi.usuarios.delete(userId, u.id);
      toast.show('Excluído', 'success');
      refresh();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro', 'error');
    }
  }

  const assocName = (id?: string) => (id ? associacoes.find((a) => a.id === id)?.nome ?? id : '-');

  return (
    <Stack spacing={2}>
      <Button variant="contained" onClick={startCreate}>
        Novo usuário
      </Button>

      <DataTable
        title="Usuários"
        rows={rows}
        columns={[
          { key: 'nome', header: 'Nome', render: (r) => r.nome },
          { key: 'email', header: 'Email', render: (r) => r.email },
          { key: 'role', header: 'Perfil', render: (r) => r.role },
          { key: 'assoc', header: 'Associação', render: (r) => assocName(r.associacaoId) },
        ]}
        onEdit={startEdit}
        onDelete={onDelete}
        getSearchText={(r) => `${r.nome} ${r.email} ${r.role} ${assocName(r.associacaoId)}`}
      />

      <Modal
        open={open}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
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
          <FormField id="user_nome" label="Nome" value={form.nome} onChange={(v) => setForm((s) => ({ ...s, nome: v }))} required error={errors.nome} />
          <FormField id="user_email" label="Email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} required error={errors.email} autoComplete="email" />
          <FormField
            id="user_senha"
            label={editing ? 'Senha (opcional)' : 'Senha'}
            value={form.senha}
            onChange={(v) => setForm((s) => ({ ...s, senha: v }))}
            error={errors.senha}
            type="password"
            autoComplete="new-password"
          />

          <FormControl fullWidth required>
            <InputLabel id="role_label">Perfil</InputLabel>
            <Select
              labelId="role_label"
              label="Perfil"
              value={form.role}
              onChange={(e) => {
                const role = e.target.value as Role;
                setForm((s) => ({ ...s, role, associacaoId: role === 'validador' ? s.associacaoId ?? associacoes[0]?.id : undefined }));
              }}
            >
              <MenuItem value="admin">admin</MenuItem>
              <MenuItem value="operador">operador</MenuItem>
              <MenuItem value="validador">validador</MenuItem>
            </Select>
          </FormControl>

          {form.role === 'validador' ? (
            <FormControl fullWidth required error={Boolean(errors.associacaoId)}>
              <InputLabel id="assoc_label">Associação do validador</InputLabel>
              <Select
                labelId="assoc_label"
                label="Associação do validador"
                value={form.associacaoId ?? ''}
                onChange={(e) => setForm((s) => ({ ...s, associacaoId: e.target.value }))}
              >
                {associacoes.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.nome}
                  </MenuItem>
                ))}
              </Select>
              {errors.associacaoId ? (
                <Typography variant="caption" color="error">
                  {errors.associacaoId}
                </Typography>
              ) : null}
            </FormControl>
          ) : null}
        </Stack>
      </Modal>
    </Stack>
  );
}
