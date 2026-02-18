import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { DataTable } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Bairro, Cliente, Grupo } from '../types/entities';

type FormState = Omit<Cliente, 'id'>;

export function ClientesPage() {
  const auth = useAuth();
  const toast = useToast();

  const [rows, setRows] = React.useState<Cliente[]>([]);
  const [bairros, setBairros] = React.useState<Bairro[]>([]);
  const [grupos, setGrupos] = React.useState<Grupo[]>([]);
  const [clienteGrupoIds, setClienteGrupoIds] = React.useState<Record<string, string[]>>({});

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
  const [selectedGrupoIds, setSelectedGrupoIds] = React.useState<string[]>([]);

  function refresh() {
    if (!auth.user) return;
    const userId = auth.user.id;
    const list = mockApi.clientes.list(userId);
    setRows(list);
    setBairros(mockApi.lookups.listBairros());
    setGrupos(mockApi.lookups.listGrupos());

    var map: Record<string, string[]> = {};
    list.forEach(function (c) {
      map[c.id] = mockApi.clienteGrupos
        .listByCliente(userId, c.id)
        .map(function (cg) {
          return cg.grupoId;
        });
    });
    setClienteGrupoIds(map);
  }

  React.useEffect(
    function () {
      refresh();
    },
    [auth.user],
  );

  if (!auth.user) return null;
  var userId = auth.user.id;

  function bairroName(id: string) {
    var b = bairros.find(function (x) {
      return x.id === id;
    });
    return b ? b.nome : id;
  }

  function grupoName(id: string) {
    var g = grupos.find(function (x) {
      return x.id === id;
    });
    return g ? g.nome : id;
  }

  function validate(): string | null {
    if (!form.nome.trim()) return 'Nome é obrigatório';
    if (!form.telefone.trim()) return 'Telefone é obrigatório';
    if (!form.bairroId) return 'Bairro é obrigatório';
    return null;
  }

  function startCreate() {
    setEditing(null);
    setForm({ nome: '', telefone: '', email: '', bairroId: bairros[0] ? bairros[0].id : '', cadencia: 'diario', ativo: true });
    setSelectedGrupoIds([]);
    setOpen(true);
  }

  function startEdit(c: Cliente) {
    setEditing(c);
    setForm({
      nome: c.nome,
      telefone: c.telefone,
      email: c.email || '',
      bairroId: c.bairroId,
      cadencia: c.cadencia,
      ativo: c.ativo,
    });
    setSelectedGrupoIds(clienteGrupoIds[c.id] || []);
    setOpen(true);
  }

  function onSave() {
    var err = validate();
    if (err) {
      toast.show(err, 'warning');
      return;
    }

    try {
      var payload: Omit<Cliente, 'id'> = {
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email && form.email.trim() ? form.email.trim() : undefined,
        bairroId: form.bairroId,
        cadencia: form.cadencia,
        ativo: form.ativo,
      };

      if (editing) {
        mockApi.clientes.update(userId, editing.id, payload, selectedGrupoIds);
        toast.show('Cliente atualizado', 'success');
      } else {
        mockApi.clientes.create(userId, payload, selectedGrupoIds);
        toast.show('Cliente criado', 'success');
      }

      setOpen(false);
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  function onDelete(c: Cliente) {
    if (!confirm('Excluir cliente "' + c.nome + '"?')) return;
    try {
      mockApi.clientes.delete(userId, c.id);
      toast.show('Excluído', 'success');
      refresh();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  function renderGrupos(c: Cliente) {
    var ids = clienteGrupoIds[c.id] || [];
    if (ids.length === 0) return <Typography variant="body2" color="text.secondary">-</Typography>;
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {ids.slice(0, 3).map(function (gid) {
          return <Chip key={gid} size="small" label={grupoName(gid)} />;
        })}
        {ids.length > 3 ? <Chip size="small" label={'+' + String(ids.length - 3)} /> : null}
      </Box>
    );
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
          { key: 'nome', header: 'Nome', render: function (r) {
            return r.nome;
          } },
          { key: 'telefone', header: 'Telefone', render: function (r) {
            return r.telefone;
          } },
          { key: 'bairro', header: 'Bairro', render: function (r) {
            return bairroName(r.bairroId);
          } },
          { key: 'grupos', header: 'Grupos', render: function (r) {
            return renderGrupos(r);
          } },
          { key: 'ativo', header: 'Ativo', render: function (r) {
            return r.ativo ? 'Sim' : 'Não';
          } },
        ]}
        onEdit={startEdit}
        onDelete={onDelete}
        getSearchText={function (r) {
          return (r.nome + ' ' + r.telefone + ' ' + bairroName(r.bairroId) + ' ' + (clienteGrupoIds[r.id] || []).map(grupoName).join(' ')).trim();
        }}
      />

      <Modal
        open={open}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
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
          <FormField id="cli_nome" label="Nome" value={form.nome} onChange={function (v) {
            setForm({ ...form, nome: v });
          }} required />
          <FormField id="cli_tel" label="Telefone" value={form.telefone} onChange={function (v) {
            setForm({ ...form, telefone: v });
          }} required />
          <FormField id="cli_email" label="Email (opcional)" value={form.email || ''} onChange={function (v) {
            setForm({ ...form, email: v });
          }} />

          <FormControl fullWidth required>
            <InputLabel id="cli_bairro_label">Bairro</InputLabel>
            <Select
              labelId="cli_bairro_label"
              label="Bairro"
              value={form.bairroId}
              onChange={function (e) {
                setForm({ ...form, bairroId: String(e.target.value) });
              }}
            >
              {bairros.map(function (b) {
                return (
                  <MenuItem key={b.id} value={b.id}>
                    {b.nome}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="cli_cad_label">Cadência</InputLabel>
            <Select
              labelId="cli_cad_label"
              label="Cadência"
              value={form.cadencia}
              onChange={function (e) {
                setForm({ ...form, cadencia: e.target.value as any });
              }}
            >
              <MenuItem value="diario">diario</MenuItem>
              <MenuItem value="semanal">semanal</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="cli_grupos_label">Grupos</InputLabel>
            <Select
              labelId="cli_grupos_label"
              multiple
              value={selectedGrupoIds}
              onChange={function (e) {
                setSelectedGrupoIds(e.target.value as string[]);
              }}
              input={<OutlinedInput label="Grupos" />}
              renderValue={function (selected) {
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map(function (gid) {
                      return <Chip key={gid} label={grupoName(gid)} size="small" />;
                    })}
                  </Box>
                );
              }}
            >
              {grupos.map(function (g) {
                return (
                  <MenuItem key={g.id} value={g.id}>
                    {g.nome}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Checkbox checked={form.ativo} onChange={function (e) {
              setForm({ ...form, ativo: e.target.checked });
            }} />}
            label="Ativo"
          />
        </Stack>
      </Modal>
    </Stack>
  );
}
