/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Associacao,
  Bairro,
  BoletimConfig,
  BoletimConfigStatus,
  BoletimExecucao,
  BoletimItemExecucao,
  BoletimItemTemplate,
  Cadencia,
  Cliente,
  ClienteGrupo,
  EnvioResumoLog,
  Grupo,
  Usuario,
} from '../types/entities';
import { loadJson, saveJson } from './storage';
import { makeSeed, type DbShape } from './seed';

const DB_KEY = 'newboletin.db.v2';
const SESSION_KEY = 'newboletin.session.v2';

export interface Session {
  userId: string;
  associacaoId: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return prefix + '_' + crypto.randomUUID();
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7);
}

function getDb(): DbShape {
  const current = loadJson<DbShape>(DB_KEY);
  if (current) return current;
  const seed = makeSeed();
  saveJson(DB_KEY, seed);
  return seed;
}

function setDb(next: DbShape): void {
  saveJson(DB_KEY, next);
}

function requireUser(userId: string): Usuario {
  const db = getDb();
  const u = db.usuarios.find(function (x) {
    return x.id === userId;
  });
  if (!u) throw new Error('Usuário não encontrado');
  return u;
}

function pickPublicUser(u: Usuario): Omit<Usuario, 'senha'> {
  const rest: any = { ...u };
  delete rest.senha;
  return rest as Omit<Usuario, 'senha'>;
}

function assertRole(u: Usuario, roles: string[]): void {
  if (roles.indexOf(u.role) < 0) throw new Error('Acesso negado');
}

function getSession(): Session | null {
  return loadJson<Session>(SESSION_KEY);
}

function periodLabelFromDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString();
}

function cloneTemplateToExecucao(db: DbShape, configId: string, execId: string): void {
  const ts = nowIso();
  const templates = db.boletimTemplateItens.filter(function (t) {
    return t.boletimConfigId === configId;
  });
  templates.forEach(function (t) {
    db.boletimExecucaoItens.unshift({
      id: uid('exec_item'),
      boletimExecucaoId: execId,
      secao: t.secao,
      titulo: t.titulo,
      conteudo: t.conteudo,
      criadoEm: ts,
    });
  });
}

function listClientesDoGrupo(db: DbShape, grupoId: string): Cliente[] {
  const ids: string[] = db.clienteGrupos
    .filter(function (cg) {
      return cg.grupoId === grupoId;
    })
    .map(function (cg) {
      return cg.clienteId;
    });

  return db.clientes.filter(function (c) {
    return c.ativo && ids.indexOf(c.id) >= 0;
  });
}

export const mockApi = {
  db: {
    reset(): void {
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem(SESSION_KEY);
      getDb();
    },
  },

  auth: {
    getSession: getSession,

    logout(): void {
      localStorage.removeItem(SESSION_KEY);
    },

    getCurrentUser(): Omit<Usuario, 'senha'> | null {
      const sess = getSession();
      if (!sess) return null;
      const u = requireUser(sess.userId);
      return pickPublicUser(u);
    },

    login(email: string, senha: string): Omit<Usuario, 'senha'> {
      const db = getDb();
      const user = db.usuarios.find(function (u) {
        return u.email === email && u.senha === senha;
      });
      if (!user) throw new Error('Credenciais inválidas');
      saveJson<Session>(SESSION_KEY, { userId: user.id, associacaoId: db.associacao.id });
      return pickPublicUser(user);
    },
  },

  onboarding: {
    hasAssociacao(): boolean {
      const db = getDb();
      return Boolean(db.associacao && db.associacao.id);
    },

    signup(payload: {
      associacao: Omit<Associacao, 'id' | 'podeAprovar'>;
      user: { nome: string; email: string; senha: string };
    }): Omit<Usuario, 'senha'> {
      const db = getDb();

      // single-tenant: se já existe, não deixa.
      if (db.usuarios.length > 0) {
        throw new Error('Instância já configurada');
      }

      const associacaoId = 'assoc_single';
      db.associacao = {
        id: associacaoId,
        nome: payload.associacao.nome,
        responsavel: payload.associacao.responsavel,
        telefone: payload.associacao.telefone,
        email: payload.associacao.email,
        podeAprovar: true,
      };

      const user: Usuario = {
        id: uid('user'),
        nome: payload.user.nome,
        email: payload.user.email,
        senha: payload.user.senha,
        role: 'admin',
        associacaoId: associacaoId,
      };

      db.usuarios.unshift(user);
      setDb(db);
      saveJson<Session>(SESSION_KEY, { userId: user.id, associacaoId: associacaoId });
      return pickPublicUser(user);
    },
  },

  associacao: {
    get(currentUserId: string): Associacao {
      requireUser(currentUserId);
      return getDb().associacao;
    },

    update(currentUserId: string, patch: Partial<Omit<Associacao, 'id'>>): Associacao {
      const u = requireUser(currentUserId);
      const db = getDb();

      // regra clara:
      // - admin edita tudo
      // - revisor edita apenas telefone + email
      // - operador só leitura
      if (u.role === 'operador') throw new Error('Acesso negado');

      if (u.role === 'revisor') {
        const allowed: any = {};
        if (typeof patch.telefone !== 'undefined') allowed.telefone = patch.telefone;
        if (typeof patch.email !== 'undefined') allowed.email = patch.email;
        db.associacao = { ...db.associacao, ...allowed };
      } else {
        db.associacao = { ...db.associacao, ...patch };
      }

      setDb(db);
      return db.associacao;
    },
  },

  bairros: {
    list(currentUserId: string): Bairro[] {
      requireUser(currentUserId);
      return getDb().bairros;
    },
  },

  usuarios: {
    list(currentUserId: string): Omit<Usuario, 'senha'>[] {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      return getDb().usuarios.map(function (x) {
        return pickPublicUser(x);
      });
    },
    create(currentUserId: string, data: Omit<Usuario, 'id'>): Omit<Usuario, 'senha'> {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      if (
        db.usuarios.some(function (uu) {
          return uu.email === data.email;
        })
      ) {
        throw new Error('Email já existe');
      }
      const item: Usuario = { id: uid('user'), ...data, associacaoId: db.associacao.id };
      db.usuarios.unshift(item);
      setDb(db);
      return pickPublicUser(item);
    },
    update(currentUserId: string, id: string, patch: Partial<Omit<Usuario, 'id'>>): Omit<Usuario, 'senha'> {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      const idx = db.usuarios.findIndex(function (x) {
        return x.id === id;
      });
      if (idx < 0) throw new Error('Usuário não encontrado');
      db.usuarios[idx] = { ...db.usuarios[idx], ...patch };
      setDb(db);
      return pickPublicUser(db.usuarios[idx]);
    },
    delete(currentUserId: string, id: string): void {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      db.usuarios = db.usuarios.filter(function (x) {
        return x.id !== id;
      });
      setDb(db);
    },
    listRevisores(currentUserId: string): Omit<Usuario, 'senha'>[] {
      requireUser(currentUserId);
      return getDb().usuarios
        .filter(function (u) {
          return u.role === 'revisor' || u.role === 'admin';
        })
        .map(function (u) {
          return pickPublicUser(u);
        });
    },
  },

  grupos: {
    list(currentUserId: string): Grupo[] {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      return getDb().grupos.slice().sort(function (a, b) {
        return a.nome.localeCompare(b.nome);
      });
    },
    create(currentUserId: string, data: Omit<Grupo, 'id' | 'criadoEm'>): Grupo {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      const item: Grupo = { id: uid('grp'), nome: data.nome, descricao: data.descricao, criadoEm: nowIso() };
      db.grupos.unshift(item);
      setDb(db);
      return item;
    },
    update(currentUserId: string, id: string, patch: Partial<Omit<Grupo, 'id' | 'criadoEm'>>): Grupo {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      const idx = db.grupos.findIndex(function (g) {
        return g.id === id;
      });
      if (idx < 0) throw new Error('Grupo não encontrado');
      db.grupos[idx] = { ...db.grupos[idx], ...patch };
      setDb(db);
      return db.grupos[idx];
    },
    delete(currentUserId: string, id: string): void {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      const hasClients = db.clienteGrupos.some(function (cg) {
        return cg.grupoId === id;
      });
      if (hasClients) throw new Error('Não é possível excluir: há clientes vinculados');
      db.grupos = db.grupos.filter(function (g) {
        return g.id !== id;
      });
      setDb(db);
    },
  },

  clienteGrupos: {
    listByCliente(currentUserId: string, clienteId: string): ClienteGrupo[] {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin', 'operador']);
      return getDb().clienteGrupos.filter(function (cg) {
        return cg.clienteId === clienteId;
      });
    },

    listByGrupo(currentUserId: string, grupoId: string): ClienteGrupo[] {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      return getDb().clienteGrupos.filter(function (cg) {
        return cg.grupoId === grupoId;
      });
    },

    assign(currentUserId: string, clienteId: string, grupoIds: string[]): void {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin', 'operador']);
      const db = getDb();
      db.clienteGrupos = db.clienteGrupos.filter(function (cg) {
        return cg.clienteId !== clienteId;
      });
      grupoIds.forEach(function (gid) {
        db.clienteGrupos.unshift({ id: uid('cg'), clienteId: clienteId, grupoId: gid });
      });
      setDb(db);
    },
  },

  clientes: {
    list(currentUserId: string): Cliente[] {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin', 'operador']);
      return getDb().clientes;
    },
    create(currentUserId: string, data: Omit<Cliente, 'id'>, grupoIds: string[]): Cliente {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin', 'operador']);
      const db = getDb();
      const item: Cliente = { id: uid('cli'), ...data };
      db.clientes.unshift(item);
      db.clienteGrupos = db.clienteGrupos.filter(function (cg) {
        return cg.clienteId !== item.id;
      });
      grupoIds.forEach(function (gid) {
        db.clienteGrupos.unshift({ id: uid('cg'), clienteId: item.id, grupoId: gid });
      });
      setDb(db);
      return item;
    },
    update(currentUserId: string, id: string, patch: Partial<Omit<Cliente, 'id'>>, grupoIds: string[]): Cliente {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin', 'operador']);
      const db = getDb();
      const idx = db.clientes.findIndex(function (c) {
        return c.id === id;
      });
      if (idx < 0) throw new Error('Cliente não encontrado');
      db.clientes[idx] = { ...db.clientes[idx], ...patch };

      db.clienteGrupos = db.clienteGrupos.filter(function (cg) {
        return cg.clienteId !== id;
      });
      grupoIds.forEach(function (gid) {
        db.clienteGrupos.unshift({ id: uid('cg'), clienteId: id, grupoId: gid });
      });

      setDb(db);
      return db.clientes[idx];
    },
    delete(currentUserId: string, id: string): void {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin', 'operador']);
      const db = getDb();
      db.clientes = db.clientes.filter(function (c) {
        return c.id !== id;
      });
      db.clienteGrupos = db.clienteGrupos.filter(function (cg) {
        return cg.clienteId !== id;
      });
      setDb(db);
    },
  },

  boletinsConfig: {
    list(currentUserId: string, filters?: { status?: BoletimConfigStatus | 'todos'; tipo?: Cadencia | 'todos'; grupoId?: string | 'todos' }): BoletimConfig[] {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin', 'operador', 'revisor']);
      const db = getDb();
      var rows = db.boletimConfigs.slice();
      if (filters && filters.status && filters.status !== 'todos') {
        rows = rows.filter(function (b) {
          return b.status === filters.status;
        });
      }
      if (filters && filters.tipo && filters.tipo !== 'todos') {
        rows = rows.filter(function (b) {
          return b.tipo === filters.tipo;
        });
      }
      if (filters && filters.grupoId && filters.grupoId !== 'todos') {
        rows = rows.filter(function (b) {
          return b.grupoId === filters.grupoId;
        });
      }
      rows.sort(function (a, b) {
        return b.atualizadoEm.localeCompare(a.atualizadoEm);
      });
      return rows;
    },

    get(currentUserId: string, configId: string): { config: BoletimConfig; templateItens: BoletimItemTemplate[] } {
      requireUser(currentUserId);
      const db = getDb();
      const config = db.boletimConfigs.find(function (c) {
        return c.id === configId;
      });
      if (!config) throw new Error('Config não encontrada');
      return {
        config: config,
        templateItens: db.boletimTemplateItens.filter(function (t) {
          return t.boletimConfigId === configId;
        }),
      };
    },

    create(
      currentUserId: string,
      data: {
        titulo: string;
        tipo: Cadencia;
        primeiroEnvioEm: string;
        periodicidade: Cadencia;
        grupoId: string;
        revisorUserId: string;
        templateItens: Array<Omit<BoletimItemTemplate, 'id' | 'boletimConfigId' | 'criadoEm'>>;
      },
    ): BoletimConfig {
      const u = requireUser(currentUserId);
      // regra: somente admin cria/pausa/edita configs
      assertRole(u, ['admin']);

      const db = getDb();
      const ts = nowIso();
      const id = uid('bc');
      const config: BoletimConfig = {
        id: id,
        titulo: data.titulo,
        tipo: data.tipo,
        primeiroEnvioEm: data.primeiroEnvioEm,
        periodicidade: data.periodicidade,
        grupoId: data.grupoId,
        revisorUserId: data.revisorUserId,
        status: 'ativo',
        criadoPorUserId: u.id,
        criadoEm: ts,
        atualizadoEm: ts,
        proximoEnvioEm: data.primeiroEnvioEm,
      };
      db.boletimConfigs.unshift(config);
      data.templateItens.forEach(function (it) {
        db.boletimTemplateItens.unshift({
          id: uid('tmpl'),
          boletimConfigId: id,
          secao: it.secao,
          titulo: it.titulo,
          conteudo: it.conteudo,
          criadoEm: ts,
        });
      });
      setDb(db);
      return config;
    },

    pause(currentUserId: string, configId: string): BoletimConfig {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      const idx = db.boletimConfigs.findIndex(function (c) {
        return c.id === configId;
      });
      if (idx < 0) throw new Error('Config não encontrada');
      db.boletimConfigs[idx] = { ...db.boletimConfigs[idx], status: 'pausado', atualizadoEm: nowIso() };
      setDb(db);
      return db.boletimConfigs[idx];
    },

    resume(currentUserId: string, configId: string): BoletimConfig {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      const idx = db.boletimConfigs.findIndex(function (c) {
        return c.id === configId;
      });
      if (idx < 0) throw new Error('Config não encontrada');
      db.boletimConfigs[idx] = { ...db.boletimConfigs[idx], status: 'ativo', atualizadoEm: nowIso() };
      setDb(db);
      return db.boletimConfigs[idx];
    },
  },

  boletinsExecucoes: {
    listByConfig(currentUserId: string, configId: string): BoletimExecucao[] {
      requireUser(currentUserId);
      const db = getDb();
      return db.boletimExecucoes
        .filter(function (e) {
          return e.boletimConfigId === configId;
        })
        .slice()
        .sort(function (a, b) {
          return b.geradoEm.localeCompare(a.geradoEm);
        });
    },

    get(currentUserId: string, execId: string): { execucao: BoletimExecucao; itens: BoletimItemExecucao[]; config: BoletimConfig } {
      requireUser(currentUserId);
      const db = getDb();
      const execucao = db.boletimExecucoes.find(function (e) {
        return e.id === execId;
      });
      if (!execucao) throw new Error('Execução não encontrada');
      const config = db.boletimConfigs.find(function (c) {
        return c.id === execucao.boletimConfigId;
      });
      if (!config) throw new Error('Config não encontrada');
      const itens = db.boletimExecucaoItens.filter(function (it) {
        return it.boletimExecucaoId === execId;
      });
      return { execucao: execucao, itens: itens, config: config };
    },

    updateItens(currentUserId: string, execId: string, itens: Array<Omit<BoletimItemExecucao, 'id' | 'boletimExecucaoId' | 'criadoEm'>>): void {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin', 'operador']);
      const db = getDb();
      const exec = db.boletimExecucoes.find(function (e) {
        return e.id === execId;
      });
      if (!exec) throw new Error('Execução não encontrada');
      if (exec.status !== 'pendente_aprovacao') throw new Error('Só pode editar enquanto pendente');

      db.boletimExecucaoItens = db.boletimExecucaoItens.filter(function (it) {
        return it.boletimExecucaoId !== execId;
      });
      const ts = nowIso();
      itens.forEach(function (it) {
        db.boletimExecucaoItens.unshift({
          id: uid('exec_item'),
          boletimExecucaoId: execId,
          secao: it.secao,
          titulo: it.titulo,
          conteudo: it.conteudo,
          criadoEm: ts,
        });
      });
      setDb(db);
    },

    approve(currentUserId: string, execId: string): BoletimExecucao {
      const u = requireUser(currentUserId);
      const db = getDb();
      const idx = db.boletimExecucoes.findIndex(function (e) {
        return e.id === execId;
      });
      if (idx < 0) throw new Error('Execução não encontrada');
      const exec = db.boletimExecucoes[idx];
      const cfg = db.boletimConfigs.find(function (c) {
        return c.id === exec.boletimConfigId;
      });
      if (!cfg) throw new Error('Config não encontrada');

      const can = u.role === 'admin' || (u.role === 'revisor' && cfg.revisorUserId === u.id);
      if (!can) throw new Error('Acesso negado');
      if (exec.status !== 'pendente_aprovacao') throw new Error('Não está pendente');

      const ts = nowIso();
      db.boletimExecucoes[idx] = { ...exec, status: 'aprovado', aprovadoPorUserId: u.id, aprovadoEm: ts };
      setDb(db);
      return db.boletimExecucoes[idx];
    },

    reject(currentUserId: string, execId: string, motivo: string): BoletimExecucao {
      const u = requireUser(currentUserId);
      const db = getDb();
      const idx = db.boletimExecucoes.findIndex(function (e) {
        return e.id === execId;
      });
      if (idx < 0) throw new Error('Execução não encontrada');
      const exec = db.boletimExecucoes[idx];
      const cfg = db.boletimConfigs.find(function (c) {
        return c.id === exec.boletimConfigId;
      });
      if (!cfg) throw new Error('Config não encontrada');

      const can = u.role === 'admin' || (u.role === 'revisor' && cfg.revisorUserId === u.id);
      if (!can) throw new Error('Acesso negado');
      if (exec.status !== 'pendente_aprovacao') throw new Error('Não está pendente');

      const ts = nowIso();
      db.boletimExecucoes[idx] = { ...exec, status: 'rejeitado', rejeitadoPorUserId: u.id, rejeitadoEm: ts, motivo: motivo };
      setDb(db);
      return db.boletimExecucoes[idx];
    },

    send(currentUserId: string, execId: string): { execucao: BoletimExecucao; resumo: EnvioResumoLog } {
      const u = requireUser(currentUserId);
      assertRole(u, ['admin']);
      const db = getDb();
      const idx = db.boletimExecucoes.findIndex(function (e) {
        return e.id === execId;
      });
      if (idx < 0) throw new Error('Execução não encontrada');
      const exec = db.boletimExecucoes[idx];
      if (exec.status !== 'aprovado') throw new Error('Apenas aprovado pode enviar');

      const cfg = db.boletimConfigs.find(function (c) {
        return c.id === exec.boletimConfigId;
      });
      if (!cfg) throw new Error('Config não encontrada');

      const clientes = listClientesDoGrupo(db, cfg.grupoId);
      const total = clientes.length;
      const falha = total === 0 ? 0 : Math.floor(total * 0.1);
      const sucesso = total - falha;

      const ts = nowIso();
      const resumo: EnvioResumoLog = {
        id: uid('env_res'),
        boletimExecucaoId: execId,
        data: ts,
        total: total,
        sucesso: sucesso,
        falha: falha,
      };
      db.enviosResumo.unshift(resumo);

      clientes.forEach(function (c, idx2) {
        const status = idx2 < falha ? 'falha' : 'sucesso';
        db.enviosPorCliente.unshift({ id: uid('env_cli'), boletimExecucaoId: execId, clienteId: c.id, data: ts, status: status });
      });

      db.boletimExecucoes[idx] = { ...exec, status: 'enviado', enviadoEm: ts };
      setDb(db);
      return { execucao: db.boletimExecucoes[idx], resumo: resumo };
    },
  },

  envios: {
    listResumo(currentUserId: string): EnvioResumoLog[] {
      requireUser(currentUserId);
      return getDb().enviosResumo.slice().sort(function (a, b) {
        return b.data.localeCompare(a.data);
      });
    },
  },

  scheduler: {
    tick(currentUserId: string): { generated: number } {
      // pode rodar com qualquer usuário logado
      requireUser(currentUserId);
      const db = getDb();
      const now = new Date();
      var generated = 0;

      db.boletimConfigs.forEach(function (cfg) {
        if (cfg.status !== 'ativo') return;

        const due = new Date(cfg.proximoEnvioEm);
        if (due.getTime() > now.getTime()) return;

        // anti-duplicação: já existe execução gerada nesta data exata?
        const exists = db.boletimExecucoes.some(function (e) {
          return e.boletimConfigId === cfg.id && e.geradoEm === cfg.proximoEnvioEm;
        });
        if (exists) return;

        const execId = uid('exec');
        const ts = nowIso();
        db.boletimExecucoes.unshift({
          id: execId,
          boletimConfigId: cfg.id,
          geradoEm: cfg.proximoEnvioEm,
          periodoLabel: periodLabelFromDate(cfg.proximoEnvioEm),
          status: 'pendente_aprovacao',
        });

        cloneTemplateToExecucao(db, cfg.id, execId);

        // recalcula próximo envio
        var next: string;
        if (cfg.periodicidade === 'diario') next = addDays(cfg.proximoEnvioEm, 1);
        else next = addWeeks(cfg.proximoEnvioEm, 1);

        cfg.proximoEnvioEm = next;
        cfg.atualizadoEm = ts;
        generated += 1;
      });

      setDb(db);
      return { generated: generated };
    },
  },

  lookups: {
    listBairros(): Bairro[] {
      return getDb().bairros;
    },
    listGrupos(): Grupo[] {
      return getDb().grupos;
    },
    listUsuariosPublicos(): Omit<Usuario, 'senha'>[] {
      return getDb().usuarios.map(function (u) {
        return pickPublicUser(u);
      });
    },
    getGrupoName(grupoId: string): string {
      const g = getDb().grupos.find(function (x) {
        return x.id === grupoId;
      });
      return g ? g.nome : grupoId;
    },
  },
};
