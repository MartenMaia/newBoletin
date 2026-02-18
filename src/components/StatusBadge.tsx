import { Chip } from '@mui/material';
import type { BoletimConfigStatus, BoletimExecucaoStatus } from '../types/entities';

type AnyStatus = BoletimConfigStatus | BoletimExecucaoStatus;

const map: Record<AnyStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  ativo: { label: 'Ativo', color: 'success' },
  pausado: { label: 'Pausado', color: 'default' },
  pendente_aprovacao: { label: 'Pendente aprovação', color: 'warning' },
  aprovado: { label: 'Aprovado', color: 'success' },
  rejeitado: { label: 'Rejeitado', color: 'error' },
  enviado: { label: 'Enviado', color: 'info' },
};

export function StatusBadge(props: { status: AnyStatus }) {
  const meta = map[props.status];
  return <Chip size="small" label={meta.label} color={meta.color} />;
}
