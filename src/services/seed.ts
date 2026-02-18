import type {
  Associacao,
  Bairro,
  BoletimConfig,
  BoletimExecucao,
  BoletimItemExecucao,
  BoletimItemTemplate,
  Cliente,
  ClienteGrupo,
  EnvioPorClienteLog,
  EnvioResumoLog,
  Grupo,
  Usuario,
} from '../types/entities';

export interface DbShape {
  associacao: Associacao;
  bairros: Bairro[];
  usuarios: Usuario[];
  grupos: Grupo[];
  clientes: Cliente[];
  clienteGrupos: ClienteGrupo[];
  boletimConfigs: BoletimConfig[];
  boletimExecucoes: BoletimExecucao[];
  boletimTemplateItens: BoletimItemTemplate[];
  boletimExecucaoItens: BoletimItemExecucao[];
  enviosResumo: EnvioResumoLog[];
  enviosPorCliente: EnvioPorClienteLog[];
}

export const SEED_CREDENTIALS = {
  admin: { email: 'admin@newboletin.local', senha: 'admin123' },
  operador: { email: 'operador@newboletin.local', senha: 'operador123' },
  revisor: { email: 'revisor@newboletin.local', senha: 'revisor123' },
} as const;

export function florianopolisBairros(): string[] {
  return [
    'Abraão',
    'Agronômica',
    'Armação',
    'Barra da Lagoa',
    'Bom Abrigo',
    'Cachoeira do Bom Jesus',
    'Campeche',
    'Canasvieiras',
    'Capoeiras',
    'Centro',
    'Córrego Grande',
    'Costa da Lagoa',
    'Costeira do Pirajubaé',
    'Estreito',
    'Ingleses do Rio Vermelho',
    'Itacorubi',
    'Itaguaçu',
    'José Mendes',
    'João Paulo',
    'Jurerê',
    'Lagoa da Conceição',
    'Pântano do Sul',
    'Porto da Lagoa',
    'Praia Brava',
    'Ratones',
    'Ribeirão da Ilha',
    'Rio Vermelho',
    'Saco dos Limões',
    'Saco Grande',
    'Sambaqui',
    'Santo Antônio de Lisboa',
    'Trindade',
    'Tapera',
  ];
}

export function makeSeed(): DbShape {
  const associacaoId = 'assoc_single';

  const associacao: Associacao = {
    id: associacaoId,
    nome: 'Associação Central',
    responsavel: 'Maria Silva',
    telefone: '+55 48 99999-0000',
    email: 'contato@associacaocentral.local',
    podeAprovar: true,
  };

  var bairros: Bairro[] = [];
  florianopolisBairros().forEach(function (nome, idx) {
    bairros.push({ id: 'bairro_' + String(idx + 1), nome: nome });
  });

  const usuarios: Usuario[] = [
    {
      id: 'user_admin',
      nome: 'Admin',
      email: SEED_CREDENTIALS.admin.email,
      senha: SEED_CREDENTIALS.admin.senha,
      role: 'admin',
      associacaoId: associacaoId,
    },
    {
      id: 'user_operador',
      nome: 'Operador',
      email: SEED_CREDENTIALS.operador.email,
      senha: SEED_CREDENTIALS.operador.senha,
      role: 'operador',
      associacaoId: associacaoId,
    },
    {
      id: 'user_revisor',
      nome: 'Revisor',
      email: SEED_CREDENTIALS.revisor.email,
      senha: SEED_CREDENTIALS.revisor.senha,
      role: 'revisor',
      associacaoId: associacaoId,
    },
  ];

  const grupos: Grupo[] = [
    { id: 'grp_1', nome: 'Todos do Centro', descricao: 'Clientes do bairro Centro', criadoEm: new Date().toISOString() },
  ];

  var centro = bairros.find(function (b) {
    return b.nome === 'Centro';
  });

  const bairroId = centro ? centro.id : bairros[0].id;

  const clientes: Cliente[] = [
    {
      id: 'cli_1',
      nome: 'João Pereira',
      telefone: '+55 48 98888-0001',
      email: 'joao@cliente.local',
      bairroId: bairroId,
      cadencia: 'diario',
      ativo: true,
    },
    {
      id: 'cli_2',
      nome: 'Ana Souza',
      telefone: '+55 48 98888-0002',
      email: 'ana@cliente.local',
      bairroId: bairroId,
      cadencia: 'semanal',
      ativo: true,
    },
    {
      id: 'cli_3',
      nome: 'Carlos Lima',
      telefone: '+55 48 98888-0003',
      bairroId: bairroId,
      cadencia: 'diario',
      ativo: true,
    },
    {
      id: 'cli_4',
      nome: 'Fernanda Rocha',
      telefone: '+55 48 98888-0004',
      bairroId: bairroId,
      cadencia: 'semanal',
      ativo: false,
    },
    {
      id: 'cli_5',
      nome: 'Paulo Almeida',
      telefone: '+55 48 98888-0005',
      bairroId: bairroId,
      cadencia: 'diario',
      ativo: true,
    },
  ];

  const clienteGrupos: ClienteGrupo[] = [];
  clientes.forEach(function (c) {
    if (c.ativo) clienteGrupos.push({ id: 'cg_' + c.id, clienteId: c.id, grupoId: 'grp_1' });
  });

  // Exemplo de config + execução
  const now = new Date();
  const primeiroEnvioEm = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const proximoEnvioEm = primeiroEnvioEm;

  const boletimConfigs: BoletimConfig[] = [
    {
      id: 'bc_1',
      titulo: 'Boletim Diário - Centro',
      tipo: 'diario',
      primeiroEnvioEm: primeiroEnvioEm,
      periodicidade: 'diario',
      grupoId: 'grp_1',
      revisorUserId: 'user_revisor',
      status: 'ativo',
      criadoPorUserId: 'user_admin',
      criadoEm: now.toISOString(),
      atualizadoEm: now.toISOString(),
      proximoEnvioEm: proximoEnvioEm,
    },
  ];

  const boletimTemplateItens: BoletimItemTemplate[] = [
    {
      id: 'tmpl_1',
      boletimConfigId: 'bc_1',
      secao: 'seguranca',
      titulo: 'Rondas',
      conteudo: 'Rondas reforçadas durante a noite.',
      criadoEm: now.toISOString(),
    },
    {
      id: 'tmpl_2',
      boletimConfigId: 'bc_1',
      secao: 'avisos',
      titulo: 'Iluminação',
      conteudo: 'Verificar lâmpadas queimadas na praça.',
      criadoEm: now.toISOString(),
    },
  ];

  const boletimExecucoes: BoletimExecucao[] = [];
  const boletimExecucaoItens: BoletimItemExecucao[] = [];
  const enviosResumo: EnvioResumoLog[] = [];
  const enviosPorCliente: EnvioPorClienteLog[] = [];

  return {
    associacao: associacao,
    bairros: bairros,
    usuarios: usuarios,
    grupos: grupos,
    clientes: clientes,
    clienteGrupos: clienteGrupos,
    boletimConfigs: boletimConfigs,
    boletimExecucoes: boletimExecucoes,
    boletimTemplateItens: boletimTemplateItens,
    boletimExecucaoItens: boletimExecucaoItens,
    enviosResumo: enviosResumo,
    enviosPorCliente: enviosPorCliente,
  };
}
