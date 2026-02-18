export type Role = 'admin' | 'operador' | 'revisor';

export type Cadencia = 'diario' | 'semanal';

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
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: Role;
  associacaoId?: string;
}

export interface Grupo {
  id: string;
  nome: string;
  descricao?: string;
  criadoEm: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  bairroId: string;
  cadencia: Cadencia;
  ativo: boolean;
}

export interface ClienteGrupo {
  id: string;
  clienteId: string;
  grupoId: string;
}

export type BoletimConfigStatus = 'ativo' | 'pausado';

export interface BoletimConfig {
  id: string;
  titulo: string;
  tipo: Cadencia;
  primeiroEnvioEm: string;
  periodicidade: Cadencia;
  grupoId: string;
  revisorUserId: string;
  status: BoletimConfigStatus;
  criadoPorUserId: string;
  criadoEm: string;
  atualizadoEm: string;
  proximoEnvioEm: string;
}

export type BoletimExecucaoStatus = 'pendente_aprovacao' | 'aprovado' | 'rejeitado' | 'enviado';

export interface BoletimExecucao {
  id: string;
  boletimConfigId: string;
  geradoEm: string;
  periodoLabel: string;
  status: BoletimExecucaoStatus;
  aprovadoPorUserId?: string;
  aprovadoEm?: string;
  rejeitadoPorUserId?: string;
  rejeitadoEm?: string;
  motivo?: string;
  enviadoEm?: string;
}

export type BoletimSecao = 'seguranca' | 'eventos' | 'avisos';

export interface BoletimItemTemplate {
  id: string;
  boletimConfigId: string;
  secao: BoletimSecao;
  titulo: string;
  conteudo: string;
  criadoEm: string;
}

export interface BoletimItemExecucao {
  id: string;
  boletimExecucaoId: string;
  secao: BoletimSecao;
  titulo: string;
  conteudo: string;
  criadoEm: string;
}

export interface EnvioPorClienteLog {
  id: string;
  boletimExecucaoId: string;
  clienteId: string;
  data: string;
  status: 'sucesso' | 'falha';
}

export interface EnvioResumoLog {
  id: string;
  boletimExecucaoId: string;
  data: string;
  total: number;
  sucesso: number;
  falha: number;
}
