import type {
  Associacao,
  Bairro,
  Boletim,
  BoletimItem,
  Cliente,
  EnvioLog,
  Usuario,
} from '../types/entities';

export interface DbShape {
  associacoes: Associacao[];
  bairros: Bairro[];
  usuarios: Usuario[];
  clientes: Cliente[];
  boletins: Boletim[];
  boletimItens: BoletimItem[];
  envios: EnvioLog[];
}

export const SEED_CREDENTIALS = {
  admin: { email: 'admin@newboletin.local', senha: 'admin123' },
  operador: { email: 'operador@newboletin.local', senha: 'operador123' },
  validador: { email: 'validador@newboletin.local', senha: 'validador123' },
} as const;

export function makeSeed(): DbShape {
  const associacaoId = 'assoc_1';
  const bairroId = 'bairro_1';

  const associacoes: Associacao[] = [
    {
      id: associacaoId,
      nome: 'Associação Central',
      responsavel: 'Maria Silva',
      telefone: '+55 11 99999-0000',
      email: 'contato@associacaocentral.local',
      podeAprovar: true,
    },
  ];

  const bairros: Bairro[] = [
    {
      id: bairroId,
      nome: 'Centro',
      associacaoId,
    },
  ];

  const usuarios: Usuario[] = [
    {
      id: 'user_admin',
      nome: 'Admin',
      email: SEED_CREDENTIALS.admin.email,
      senha: SEED_CREDENTIALS.admin.senha,
      role: 'admin',
    },
    {
      id: 'user_operador',
      nome: 'Operador',
      email: SEED_CREDENTIALS.operador.email,
      senha: SEED_CREDENTIALS.operador.senha,
      role: 'operador',
    },
    {
      id: 'user_validador',
      nome: 'Validador',
      email: SEED_CREDENTIALS.validador.email,
      senha: SEED_CREDENTIALS.validador.senha,
      role: 'validador',
      associacaoId,
    },
  ];

  const clientes: Cliente[] = [
    {
      id: 'cli_1',
      nome: 'João Pereira',
      telefone: '+55 11 98888-0001',
      email: 'joao@cliente.local',
      bairroId,
      cadencia: 'diario',
      ativo: true,
    },
    {
      id: 'cli_2',
      nome: 'Ana Souza',
      telefone: '+55 11 98888-0002',
      email: 'ana@cliente.local',
      bairroId,
      cadencia: 'semanal',
      ativo: true,
    },
    {
      id: 'cli_3',
      nome: 'Carlos Lima',
      telefone: '+55 11 98888-0003',
      bairroId,
      cadencia: 'diario',
      ativo: true,
    },
    {
      id: 'cli_4',
      nome: 'Fernanda Rocha',
      telefone: '+55 11 98888-0004',
      bairroId,
      cadencia: 'semanal',
      ativo: false,
    },
    {
      id: 'cli_5',
      nome: 'Paulo Almeida',
      telefone: '+55 11 98888-0005',
      bairroId,
      cadencia: 'diario',
      ativo: true,
    },
  ];

  const now = new Date().toISOString();
  const boletins: Boletim[] = [
    {
      id: 'bol_1',
      titulo: 'Boletim Diário - Centro',
      bairroId,
      associacaoId,
      tipo: 'diario',
      status: 'pendente_validacao',
      criadoPorUserId: 'user_operador',
      criadoEm: now,
      atualizadoEm: now,
    },
    {
      id: 'bol_2',
      titulo: 'Boletim Semanal - Centro',
      bairroId,
      associacaoId,
      tipo: 'semanal',
      status: 'aprovado',
      criadoPorUserId: 'user_admin',
      criadoEm: now,
      atualizadoEm: now,
      aprovadoPorUserId: 'user_validador',
      aprovadoEm: now,
    },
  ];

  const boletimItens: BoletimItem[] = [
    {
      id: 'item_1',
      boletimId: 'bol_1',
      secao: 'seguranca',
      titulo: 'Rondas',
      conteudo: 'Rondas reforçadas durante a noite.',
      criadoEm: now,
    },
    {
      id: 'item_2',
      boletimId: 'bol_1',
      secao: 'avisos',
      titulo: 'Iluminação',
      conteudo: 'Verificar lâmpadas queimadas na praça.',
      criadoEm: now,
    },
    {
      id: 'item_3',
      boletimId: 'bol_2',
      secao: 'eventos',
      titulo: 'Feira',
      conteudo: 'Feira comunitária no sábado às 9h.',
      criadoEm: now,
    },
  ];

  const envios: EnvioLog[] = [
    {
      id: 'env_1',
      boletimId: 'bol_2',
      data: now,
      total: 4,
      sucesso: 4,
      falha: 0,
    },
  ];

  return {
    associacoes,
    bairros,
    usuarios,
    clientes,
    boletins,
    boletimItens,
    envios,
  };
}
