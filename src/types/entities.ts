export type Role = 'admin' | 'operador' | 'validador';

export type BoletimStatus =
  | 'rascunho'
  | 'pendente_validacao'
  | 'aprovado'
  | 'rejeitado'
  | 'enviado';

export type BoletimTipo = 'diario' | 'semanal';

export type BoletimSecao = 'seguranca' | 'eventos' | 'avisos';

export interface Associacao {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  email: string;
  podeAprovar: boolean;
}

export interface Bairro {
  id: string;
  nome: string;
  associacaoId: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: Role;
  associacaoId?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  bairroId: string;
  cadencia: BoletimTipo;
  ativo: boolean;
}

export interface Boletim {
  id: string;
  titulo: string;
  bairroId: string;
  associacaoId: string;
  tipo: BoletimTipo;
  status: BoletimStatus;
  criadoPorUserId: string;
  criadoEm: string;
  atualizadoEm: string;
  aprovadoPorUserId?: string;
  aprovadoEm?: string;
  rejeitadoMotivo?: string;
}

export interface BoletimItem {
  id: string;
  boletimId: string;
  secao: BoletimSecao;
  titulo: string;
  conteudo: string;
  criadoEm: string;
}

export interface EnvioLog {
  id: string;
  boletimId: string;
  data: string;
  total: number;
  sucesso: number;
  falha: number;
}
