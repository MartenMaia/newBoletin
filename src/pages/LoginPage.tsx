import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { FormField } from '../components/FormField';
import { SEED_CREDENTIALS } from '../services/seed';

export function LoginPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [errors, setErrors] = React.useState<{ email?: string; senha?: string }>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) nav('/app/dashboard', { replace: true });
  }, [user, nav]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email é obrigatório';
    if (!senha.trim()) e.senha = 'Senha é obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), senha);
      toast.show('Login realizado', 'success');
      nav('/app/dashboard');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Erro ao logar', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }} aria-label="Tela de login">
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Box>
            <Typography variant="h4" component="h1">
              Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use as credenciais do seed (abaixo) para entrar.
            </Typography>
          </Box>

          <FormField id="email" label="Email" value={email} onChange={setEmail} required error={errors.email} autoComplete="email" />
          <FormField id="senha" label="Senha" value={senha} onChange={setSenha} required error={errors.senha} type="password" autoComplete="current-password" />

          <Button type="submit" variant="contained" disabled={loading} aria-label="Entrar">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Credenciais seed
            </Typography>
            <Typography variant="body2">Admin: {SEED_CREDENTIALS.admin.email} / {SEED_CREDENTIALS.admin.senha}</Typography>
            <Typography variant="body2">Operador: {SEED_CREDENTIALS.operador.email} / {SEED_CREDENTIALS.operador.senha}</Typography>
            <Typography variant="body2">Validador: {SEED_CREDENTIALS.validador.email} / {SEED_CREDENTIALS.validador.senha}</Typography>
          </Paper>
        </Stack>
      </Paper>
    </Container>
  );
}
