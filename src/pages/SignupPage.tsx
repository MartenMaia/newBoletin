import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { FormField } from '../components/FormField';
import { mockApi } from '../services/mockApi';

export function SignupPage() {
  const auth = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [assocNome, setAssocNome] = React.useState('');
  const [assocResp, setAssocResp] = React.useState('');
  const [assocTel, setAssocTel] = React.useState('');
  const [assocEmail, setAssocEmail] = React.useState('');

  const [userNome, setUserNome] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [userSenha, setUserSenha] = React.useState('');

  const [loading, setLoading] = React.useState(false);

  React.useEffect(
    function () {
      if (auth.user) nav('/app/dashboard', { replace: true });
    },
    [auth.user, nav],
  );

  function validate(): string | null {
    if (!assocNome.trim()) return 'Nome da associação é obrigatório';
    if (!assocResp.trim()) return 'Responsável é obrigatório';
    if (!assocTel.trim()) return 'Telefone é obrigatório';
    if (!assocEmail.trim()) return 'Email da associação é obrigatório';
    if (!userNome.trim()) return 'Nome do usuário é obrigatório';
    if (!userEmail.trim()) return 'Email do usuário é obrigatório';
    if (!userSenha.trim()) return 'Senha do usuário é obrigatória';
    return null;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    var err = validate();
    if (err) {
      toast.show(err, 'warning');
      return;
    }

    setLoading(true);
    try {
      mockApi.onboarding.signup({
        associacao: {
          nome: assocNome.trim(),
          responsavel: assocResp.trim(),
          telefone: assocTel.trim(),
          email: assocEmail.trim(),
        },
        user: {
          nome: userNome.trim(),
          email: userEmail.trim(),
          senha: userSenha,
        },
      });

      // atualiza contexto auth
      var u = mockApi.auth.getCurrentUser();
      if (u) {
        // hack simples: recarregar page state
        window.location.href = '/app/dashboard';
        return;
      }

      toast.show('Cadastro concluído', 'success');
      nav('/app/dashboard');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erro no cadastro', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }} aria-label="Tela de assinatura">
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Box>
            <Typography variant="h4" component="h1">
              Assinatura
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Crie a associação única desta instância e o usuário admin inicial.
            </Typography>
          </Box>

          <Typography variant="h6" component="h2">
            Dados da Associação
          </Typography>
          <FormField id="assoc_nome" label="Nome" value={assocNome} onChange={setAssocNome} required />
          <FormField id="assoc_resp" label="Responsável" value={assocResp} onChange={setAssocResp} required />
          <FormField id="assoc_tel" label="Telefone" value={assocTel} onChange={setAssocTel} required />
          <FormField id="assoc_email" label="Email" value={assocEmail} onChange={setAssocEmail} required />

          <Typography variant="h6" component="h2">
            Usuário admin inicial
          </Typography>
          <FormField id="user_nome" label="Nome" value={userNome} onChange={setUserNome} required />
          <FormField id="user_email" label="Email" value={userEmail} onChange={setUserEmail} required autoComplete="email" />
          <FormField id="user_senha" label="Senha" value={userSenha} onChange={setUserSenha} required type="password" autoComplete="new-password" />

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Criando…' : 'Concluir'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
