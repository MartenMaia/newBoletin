import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../app/auth';
import { useToast } from '../app/toast';
import { FormField } from '../components/FormField';
import { SEED_CREDENTIALS } from '../services/seed';

export function LoginPage() {
  const auth = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(
    function () {
      if (auth.user) nav('/app/dashboard', { replace: true });
    },
    [auth.user, nav],
  );

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true);
    try {
      auth.login(email.trim(), senha);
      toast.show('Login realizado', 'success');
      nav('/app/dashboard', { replace: true });
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
              MVP local com mockApi (localStorage).
            </Typography>
          </Box>

          <FormField id="email" label="Email" value={email} onChange={setEmail} required autoComplete="email" />
          <FormField id="senha" label="Senha" value={senha} onChange={setSenha} required type="password" autoComplete="current-password" />

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>

          <Typography variant="body2" color="text.secondary">
            Primeira vez? <Link to="/signup">Assinar</Link>
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Credenciais seed
            </Typography>
            <Typography variant="body2">Admin: {SEED_CREDENTIALS.admin.email} / {SEED_CREDENTIALS.admin.senha}</Typography>
            <Typography variant="body2">Operador: {SEED_CREDENTIALS.operador.email} / {SEED_CREDENTIALS.operador.senha}</Typography>
            <Typography variant="body2">Revisor: {SEED_CREDENTIALS.revisor.email} / {SEED_CREDENTIALS.revisor.senha}</Typography>
          </Paper>
        </Stack>
      </Paper>
    </Container>
  );
}
