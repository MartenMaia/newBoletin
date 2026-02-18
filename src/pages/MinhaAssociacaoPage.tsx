import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { mockApi } from '../services/mockApi';
import type { Associacao } from '../types/entities';

export function MinhaAssociacaoPage() {
  const auth = useAuth();
  const toast = useToast();

  const [assoc, setAssoc] = React.useState<Associacao | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Partial<Omit<Associacao, 'id'>>>({});

  React.useEffect(
    function () {
      if (!auth.user) return;
      setAssoc(mockApi.associacao.get(auth.user.id));
    },
    [auth.user],
  );

  if (!auth.user) return null;
  if (!assoc) return null;

  var userId = auth.user.id;
  var assocData = assoc;

  var canEditAll = auth.user.role === 'admin';
  var canEditContact = auth.user.role === 'admin' || auth.user.role === 'revisor';
  var canEdit = canEditAll || canEditContact;

  function startEdit() {
    setForm({
      nome: assocData.nome,
      responsavel: assocData.responsavel,
      telefone: assocData.telefone,
      email: assocData.email,
      podeAprovar: assocData.podeAprovar,
    });
    setOpen(true);
  }

  function onSave() {
    try {
      var patch: Partial<Omit<Associacao, 'id'>> = {};

      if (canEditAll) {
        patch = {
          nome: String(form.nome || ''),
          responsavel: String(form.responsavel || ''),
          telefone: String(form.telefone || ''),
          email: String(form.email || ''),
          podeAprovar: Boolean(form.podeAprovar),
        };
      } else if (canEditContact) {
        patch = {
          telefone: String(form.telefone || ''),
          email: String(form.email || ''),
        };
      }

      var updated = mockApi.associacao.update(userId, patch);
      setAssoc(updated);
      toast.show('Associação atualizada', 'success');
      setOpen(false);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h1">
          Minha Associação
        </Typography>
        <Button variant="contained" onClick={startEdit} disabled={!canEdit} aria-disabled={!canEdit}>
          Editar
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Nome
            </Typography>
            <Typography>{assoc.nome}</Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Responsável
            </Typography>
            <Typography>{assoc.responsavel}</Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Telefone
            </Typography>
            <Typography>{assoc.telefone}</Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Email
            </Typography>
            <Typography>{assoc.email}</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Modal
        open={open}
        title="Editar associação"
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
            <Button variant="contained" onClick={onSave} disabled={!canEdit}>
              Salvar
            </Button>
          </>
        }
      >
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormField
            id="assoc_nome"
            label="Nome"
            value={String(form.nome || '')}
            onChange={function (v) {
              setForm(function (s) {
                return { ...s, nome: v };
              });
            }}
            required
          />
          <FormField
            id="assoc_resp"
            label="Responsável"
            value={String(form.responsavel || '')}
            onChange={function (v) {
              setForm(function (s) {
                return { ...s, responsavel: v };
              });
            }}
            required
          />
          <FormField
            id="assoc_tel"
            label="Telefone"
            value={String(form.telefone || '')}
            onChange={function (v) {
              setForm(function (s) {
                return { ...s, telefone: v };
              });
            }}
            required
          />
          <FormField
            id="assoc_email"
            label="Email"
            value={String(form.email || '')}
            onChange={function (v) {
              setForm(function (s) {
                return { ...s, email: v };
              });
            }}
            required
          />

          {!canEditAll ? (
            <Typography variant="caption" color="text.secondary">
              Regra: revisor edita apenas telefone e email. Operador é somente leitura.
            </Typography>
          ) : null}
        </Stack>
      </Modal>
    </Stack>
  );
}
