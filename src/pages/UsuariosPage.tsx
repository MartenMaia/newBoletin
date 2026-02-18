import { Button, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Role, Usuario } from '../types/entities';

type PublicUser = Omit<Usuario, 'senha'>;

type FormState = {
  nome: string;
  email: string;
  senha: string;
  role: Role;
};

export function UsuariosPage() {
  const auth = useAuth();
  const toast = useToast();

  const [rows, setRows] = React.useState<PublicUser[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PublicUser | null>(null);
  const [form, setForm] = React.useState<FormState>({ nome: '', email: '', senha: '', role: 'operador' });

  function refresh() {
    if (!auth.user) return;
    setRows(mockApi.usuarios.list(auth.user.id));
  }

  React.useEffect(
    function () {
      refresh();
    },
    [auth.user],
  );

  if (!auth.user) return null;
  var userId = auth.user.id;

  function validate(): string | null {
    if (!form.nome.trim()) return 'Nome é obrigatório';
    if (!form.email.trim()) return 'Email é obrigatório';
    if (!editing && !form.senha.trim()) return 'Senha é obrigatória';
    return null;
  }

  function startCreate() {
    setEditing(null);
    setForm({ nome: '', email: '', senha: '', role: 'operador' });
    setOpen(true);
  }

  function startEdit(u: PublicUser) {
    setEditing(u);
    setForm({ nome: u.nome, email: u.email, senha: '', role: u.role });
    setOpen(true);
  }

  function onSave() {
    var err = validate();
    if (err) {
      toast.show(err, 'warning');
      return;
    }

    try {
      if (editing) {
        mockApi.usuarios.update(userId, editing.id, {
          nome: form.nome.trim(),
          email: form.email.trim(),
          role: form.role,
          ...(form.senha.trim() ? { senha: form.senha } : {}),
        });
        toast.show('Usuário atualizado', 'success');
      } else {
        mockApi.usuarios.create(userId, {
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha,
          role: form.role,
          associacaoId: undefined,
        });
        toast.show('Usuário criado', 'success');
      }
      setOpen(false);
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  function onDelete(u: PublicUser) {
    if (!confirm('Excluir usuário "' + u.nome + '"?')) return;
    try {
      mockApi.usuarios.delete(userId, u.id);
      toast.show('Excluído', 'success');
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Button variant="contained" onClick={startCreate}>
        Novo usuário
      </Button>

      <DataTable
        title="Usuários"
        rows={rows}
        columns={[
          { key: 'nome', header: 'Nome', render: function (r) {
            return r.nome;
          } },
          { key: 'email', header: 'Email', render: function (r) {
            return r.email;
          } },
          { key: 'role', header: 'Perfil', render: function (r) {
            return r.role;
          } },
        ]}
        onEdit={startEdit}
        onDelete={onDelete}
        getSearchText={function (r) {
          return (r.nome + ' ' + r.email + ' ' + r.role).trim();
        }}
      />

      <Modal
        open={open}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        onClose={function () {
          setOpen(false);
        }}
        actions={
          <>
            <Button
              onClick={function () {
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button variant="contained" onClick={onSave}>
              Salvar
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormField id="user_nome" label="Nome" value={form.nome} onChange={function (v) {
            setForm({ nome: v, email: form.email, senha: form.senha, role: form.role });
          }} required />
          <FormField id="user_email" label="Email" value={form.email} onChange={function (v) {
            setForm({ nome: form.nome, email: v, senha: form.senha, role: form.role });
          }} required autoComplete="email" />
          <FormField id="user_senha" label={editing ? 'Senha (opcional)' : 'Senha'} value={form.senha} onChange={function (v) {
            setForm({ nome: form.nome, email: form.email, senha: v, role: form.role });
          }} type="password" autoComplete="new-password" />

          <FormControl fullWidth required>
            <InputLabel id="role_label">Perfil</InputLabel>
            <Select
              labelId="role_label"
              label="Perfil"
              value={form.role}
              onChange={function (e) {
                setForm({ nome: form.nome, email: form.email, senha: form.senha, role: e.target.value as Role });
              }}
            >
              <MenuItem value="admin">admin</MenuItem>
              <MenuItem value="operador">operador</MenuItem>
              <MenuItem value="revisor">revisor</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Modal>
    </Stack>
  );
}
