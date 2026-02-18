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
import { useAuth } from '../../app/auth';
import { useToast } from '../../app/toast';
import { mockApi } from '../../services/mockApi';
import type { BoletimSecao, Cadencia, Grupo, Usuario } from '../../types/entities';

type TemplateItem = { secao: BoletimSecao; titulo: string; conteudo: string };

function secaoLabel(s: BoletimSecao): string {
  if (s === 'seguranca') return 'Segurança';
  if (s === 'eventos') return 'Eventos';
  return 'Avisos';
}

export function BoletinsConfigNovoPage() {
  const auth = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [titulo, setTitulo] = React.useState('');
  const [tipo, setTipo] = React.useState<Cadencia>('diario');
  const [primeiroEnvioEm, setPrimeiroEnvioEm] = React.useState('');
  const [periodicidade, setPeriodicidade] = React.useState<Cadencia>('diario');
  const [grupoId, setGrupoId] = React.useState('');
  const [revisorUserId, setRevisorUserId] = React.useState('');

  const [grupos, setGrupos] = React.useState<Grupo[]>([]);
  const [revisores, setRevisores] = React.useState<Array<Omit<Usuario, 'senha'>>>([]);

  const [itens, setItens] = React.useState<TemplateItem[]>([{ secao: 'seguranca', titulo: '', conteudo: '' }]);

  React.useEffect(
    function () {
      if (!auth.user) return;
      var gs = mockApi.lookups.listGrupos();
      setGrupos(gs);
      if (gs[0]) setGrupoId(gs[0].id);

      var rs = mockApi.usuarios.listRevisores(auth.user.id);
      setRevisores(rs);
      if (rs[0]) setRevisorUserId(rs[0].id);

      var d = new Date();
      d.setMinutes(d.getMinutes() + 5);
      setPrimeiroEnvioEm(d.toISOString().slice(0, 16));
    },
    [auth.user],
  );

  if (!auth.user) return null;

  function cleanItens(): TemplateItem[] {
    return itens
      .map(function (i) {
        return { secao: i.secao, titulo: i.titulo.trim(), conteudo: i.conteudo.trim() };
      })
      .filter(function (i) {
        return i.titulo || i.conteudo;
      });
  }

  function addItem(secao: BoletimSecao) {
    setItens(itens.concat([{ secao: secao, titulo: '', conteudo: '' }]));
  }

  function updateItem(idx: number, patch: Partial<TemplateItem>) {
    setItens(
      itens.map(function (it, i) {
        return i === idx ? { ...it, ...patch } : it;
      }),
    );
  }

  function removeItem(idx: number) {
    setItens(
      itens.filter(function (_, i) {
        return i !== idx;
      }),
    );
  }

  function validate(): string | null {
    if (!titulo.trim()) return 'Título é obrigatório';
    if (!primeiroEnvioEm) return 'Primeiro envio é obrigatório';
    if (!grupoId) return 'Grupo é obrigatório';
    if (!revisorUserId) return 'Revisor é obrigatório';
    return null;
  }

  function onSave() {
    var err = validate();
    if (err) {
      toast.show(err, 'warning');
      return;
    }

    try {
      if (!auth.user) return;
      var userId = auth.user.id;
      var iso = new Date(primeiroEnvioEm).toISOString();
      var created = mockApi.boletinsConfig.create(userId, {
        titulo: titulo.trim(),
        tipo: tipo,
        primeiroEnvioEm: iso,
        periodicidade: periodicidade,
        grupoId: grupoId,
        revisorUserId: revisorUserId,
        templateItens: cleanItens().map(function (i) {
          return { secao: i.secao, titulo: i.titulo, conteudo: i.conteudo };
        }),
      });
      toast.show('Config criada', 'success');
      nav('/app/boletins/' + created.id);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h1">
        Novo boletim (configuração)
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Título"
            value={titulo}
            onChange={function (e) {
              setTitulo(e.target.value);
            }}
            required
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="tipo_label">Tipo</InputLabel>
              <Select
                labelId="tipo_label"
                label="Tipo"
                value={tipo}
                onChange={function (e) {
                  setTipo(e.target.value as any);
                }}
              >
                <MenuItem value="diario">diario</MenuItem>
                <MenuItem value="semanal">semanal</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Primeiro envio"
              type="datetime-local"
              value={primeiroEnvioEm}
              onChange={function (e) {
                setPrimeiroEnvioEm(e.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              required
            />

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="per_label">Periodicidade</InputLabel>
              <Select
                labelId="per_label"
                label="Periodicidade"
                value={periodicidade}
                onChange={function (e) {
                  setPeriodicidade(e.target.value as any);
                }}
              >
                <MenuItem value="diario">diario</MenuItem>
                <MenuItem value="semanal">semanal</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 260 }} required>
              <InputLabel id="grupo_label">Grupo</InputLabel>
              <Select
                labelId="grupo_label"
                label="Grupo"
                value={grupoId}
                onChange={function (e) {
                  setGrupoId(String(e.target.value));
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

            <FormControl sx={{ minWidth: 260 }} required>
              <InputLabel id="rev_label">Revisor</InputLabel>
              <Select
                labelId="rev_label"
                label="Revisor"
                value={revisorUserId}
                onChange={function (e) {
                  setRevisorUserId(String(e.target.value));
                }}
              >
                {revisores.map(function (u) {
                  return (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nome} ({u.role})
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          <Divider />
          <Typography variant="h6" component="h2">
            Template de conteúdo
          </Typography>

          {(['seguranca', 'eventos', 'avisos'] as BoletimSecao[]).map(function (secao) {
            return (
              <Box key={secao}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {secaoLabel(secao)}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={function () {
                      addItem(secao);
                    }}
                  >
                    Adicionar item
                  </Button>
                </Box>

                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {itens
                    .map(function (it, idx) {
                      return { it: it, idx: idx };
                    })
                    .filter(function (x) {
                      return x.it.secao === secao;
                    })
                    .map(function (x) {
                      return (
                        <Paper key={x.idx} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack spacing={1.5}>
                            <TextField
                              label="Título do item"
                              value={x.it.titulo}
                              onChange={function (e) {
                                updateItem(x.idx, { titulo: e.target.value });
                              }}
                              size="small"
                            />
                            <TextField
                              label="Conteúdo"
                              value={x.it.conteudo}
                              onChange={function (e) {
                                updateItem(x.idx, { conteudo: e.target.value });
                              }}
                              multiline
                              minRows={3}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                color="error"
                                onClick={function () {
                                  removeItem(x.idx);
                                }}
                              >
                                Remover
                              </Button>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                </Stack>
              </Box>
            );
          })}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={onSave}>
              Salvar configuração
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
