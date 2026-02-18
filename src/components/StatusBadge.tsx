import { Chip } from '@mui/material';
import type { BoletimStatus } from '../types/entities';

const map: Record<BoletimStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  rascunho: { label: 'Rascunho', color: 'default' },
  pendente_validacao: { label: 'Pendente validação', color: 'warning' },
  aprovado: { label: 'Aprovado', color: 'success' },
  rejeitado: { label: 'Rejeitado', color: 'error' },
  enviado: { label: 'Enviado', color: 'info' },
};

export function StatusBadge({ status }: { status: BoletimStatus }) {
  const meta = map[status];
  return <Chip size="small" label={meta.label} color={meta.color} />;
}
