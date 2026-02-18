import { Button, Stack, TextField, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Grupo } from '../types/entities';

type FormState = { nome: string; descricao: string };

export function GruposPage() {
  const auth = useAuth();
  const toast = useToast();

  const [rows, setRows] = React.useState<Grupo[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Grupo | null>(null);
  const [form, setForm] = React.useState<FormState>({ nome: '', descricao: '' });

  function refresh() {
    if (!auth.user) return;
    setRows(mockApi.grupos.list(auth.user.id));
  }

  React.useEffect(
    function () {
      refresh();
    },
    [auth.user],
  );

  if (!auth.user) return null;
  var userId = auth.user.id;

  function startCreate() {
    setEditing(null);
    setForm({ nome: '', descricao: '' });
    setOpen(true);
  }

  function startEdit(g: Grupo) {
    setEditing(g);
    setForm({ nome: g.nome, descricao: g.descricao || '' });
    setOpen(true);
  }

  function onSave() {
    if (!form.nome.trim()) {
      toast.show('Nome é obrigatório', 'warning');
      return;
    }
    try {
      if (editing) {
        mockApi.grupos.update(userId, editing.id, { nome: form.nome.trim(), descricao: form.descricao.trim() || undefined });
        toast.show('Grupo atualizado', 'success');
      } else {
        mockApi.grupos.create(userId, { nome: form.nome.trim(), descricao: form.descricao.trim() || undefined });
        toast.show('Grupo criado', 'success');
      }
      setOpen(false);
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  function onDelete(g: Grupo) {
    if (!confirm('Excluir grupo "' + g.nome + '"?')) return;
    try {
      mockApi.grupos.delete(userId, g.id);
      toast.show('Grupo excluído', 'success');
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Grupos
      </Typography>

      <Button variant="contained" onClick={startCreate}>
        Novo grupo
      </Button>

      <DataTable
        title="Grupos"
        rows={rows}
        columns={[
          { key: 'nome', header: 'Nome', render: function (r) {
            return r.nome;
          } },
          { key: 'descricao', header: 'Descrição', render: function (r) {
            return r.descricao || '-';
          } },
          { key: 'criadoEm', header: 'Criado em', render: function (r) {
            return new Date(r.criadoEm).toLocaleString();
          } },
        ]}
        onEdit={startEdit}
        onDelete={onDelete}
        getSearchText={function (r) {
          return (r.nome + ' ' + (r.descricao || '')).trim();
        }}
      />

      <Modal
        open={open}
        title={editing ? 'Editar grupo' : 'Novo grupo'}
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
          <TextField
            label="Nome"
            value={form.nome}
            onChange={function (e) {
              setForm({ nome: e.target.value, descricao: form.descricao });
            }}
            required
            inputProps={{ 'aria-label': 'Nome do grupo' }}
          />
          <TextField
            label="Descrição (opcional)"
            value={form.descricao}
            onChange={function (e) {
              setForm({ nome: form.nome, descricao: e.target.value });
            }}
            inputProps={{ 'aria-label': 'Descrição do grupo' }}
            multiline
            minRows={3}
          />
        </Stack>
      </Modal>
    </Stack>
  );
}
