/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Associacao,
  Bairro,
  Boletim,
  BoletimItem,
  BoletimStatus,
  Cliente,
  EnvioLog,
  Usuario,
} from '../types/entities';
import { loadJson, saveJson } from './storage';
import { makeSeed, type DbShape } from './seed';

const DB_KEY = 'newboletin.db.v1';
const SESSION_KEY = 'newboletin.session.v1';

export interface Session {
  userId: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
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
  const u = db.usuarios.find((x) => x.id === userId);
  if (!u) throw new Error('Usuário não encontrado');
  return u;
}

function assertAdmin(user: Usuario): void {
  if (user.role !== 'admin') throw new Error('Acesso negado (admin)');
}

function assertAdminOrOperador(user: Usuario): void {
  if (user.role !== 'admin' && user.role !== 'operador') {
    throw new Error('Acesso negado (admin/operador)');
  }
}

function assertValidador(user: Usuario): void {
  if (user.role !== 'validador') throw new Error('Acesso negado (validador)');
}

function pickPublicUser(u: Usuario): Omit<Usuario, 'senha'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { senha, ...rest } = u;
  return rest;
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
    getSession(): Session | null {
      return loadJson<Session>(SESSION_KEY);
    },

    logout(): void {
      localStorage.removeItem(SESSION_KEY);
    },

    getCurrentUser(): Omit<Usuario, 'senha'> | null {
      const sess = loadJson<Session>(SESSION_KEY);
      if (!sess) return null;
      const u = requireUser(sess.userId);
      return pickPublicUser(u);
    },

    login(email: string, senha: string): Omit<Usuario, 'senha'> {
      const db = getDb();
      const user = db.usuarios.find((u) => u.email === email && u.senha === senha);
      if (!user) throw new Error('Credenciais inválidas');
      saveJson<Session>(SESSION_KEY, { userId: user.id });
      return pickPublicUser(user);
    },
  },

  associacoes: {
    list(currentUserId: string): Associacao[] {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      return getDb().associacoes;
    },
    create(currentUserId: string, data: Omit<Associacao, 'id'>): Associacao {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      const item: Associacao = { id: uid('assoc'), ...data };
      db.associacoes.unshift(item);
      setDb(db);
      return item;
    },
    update(currentUserId: string, id: string, patch: Partial<Omit<Associacao, 'id'>>): Associacao {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      const idx = db.associacoes.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Associação não encontrada');
      db.associacoes[idx] = { ...db.associacoes[idx], ...patch };
      setDb(db);
      return db.associacoes[idx];
    },
    delete(currentUserId: string, id: string): void {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      db.associacoes = db.associacoes.filter((x) => x.id !== id);
      // cascatas simples (MVP): não implementar regras complexas, apenas salvar
      setDb(db);
    },
  },

  bairros: {
    list(currentUserId: string): Bairro[] {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      return getDb().bairros;
    },
    create(currentUserId: string, data: Omit<Bairro, 'id'>): Bairro {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      const item: Bairro = { id: uid('bairro'), ...data };
      db.bairros.unshift(item);
      setDb(db);
      return item;
    },
    update(currentUserId: string, id: string, patch: Partial<Omit<Bairro, 'id'>>): Bairro {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      const idx = db.bairros.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Bairro não encontrado');
      db.bairros[idx] = { ...db.bairros[idx], ...patch };
      setDb(db);
      return db.bairros[idx];
    },
    delete(currentUserId: string, id: string): void {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      db.bairros = db.bairros.filter((x) => x.id !== id);
      setDb(db);
    },
  },

  usuarios: {
    list(currentUserId: string): Omit<Usuario, 'senha'>[] {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      return getDb().usuarios.map(pickPublicUser);
    },
    create(currentUserId: string, data: Omit<Usuario, 'id'>): Omit<Usuario, 'senha'> {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      if (db.usuarios.some((u) => u.email === data.email)) throw new Error('Email já existe');
      const item: Usuario = { id: uid('user'), ...data };
      db.usuarios.unshift(item);
      setDb(db);
      return pickPublicUser(item);
    },
    update(currentUserId: string, id: string, patch: Partial<Omit<Usuario, 'id'>>): Omit<Usuario, 'senha'> {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      const idx = db.usuarios.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Usuário não encontrado');
      db.usuarios[idx] = { ...db.usuarios[idx], ...patch };
      setDb(db);
      return pickPublicUser(db.usuarios[idx]);
    },
    delete(currentUserId: string, id: string): void {
      const user = requireUser(currentUserId);
      assertAdmin(user);
      const db = getDb();
      db.usuarios = db.usuarios.filter((x) => x.id !== id);
      setDb(db);
    },
  },

  clientes: {
    list(currentUserId: string): Cliente[] {
      const user = requireUser(currentUserId);
      if (user.role !== 'admin' && user.role !== 'operador') {
        throw new Error('Acesso negado (admin/operador)');
      }
      return getDb().clientes;
    },
    create(currentUserId: string, data: Omit<Cliente, 'id'>): Cliente {
      const user = requireUser(currentUserId);
      if (user.role !== 'admin' && user.role !== 'operador') {
        throw new Error('Acesso negado (admin/operador)');
      }
      const db = getDb();
      const item: Cliente = { id: uid('cli'), ...data };
      db.clientes.unshift(item);
      setDb(db);
      return item;
    },
    update(currentUserId: string, id: string, patch: Partial<Omit<Cliente, 'id'>>): Cliente {
      const user = requireUser(currentUserId);
      if (user.role !== 'admin' && user.role !== 'operador') {
        throw new Error('Acesso negado (admin/operador)');
      }
      const db = getDb();
      const idx = db.clientes.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Cliente não encontrado');
      db.clientes[idx] = { ...db.clientes[idx], ...patch };
      setDb(db);
      return db.clientes[idx];
    },
    delete(currentUserId: string, id: string): void {
      const user = requireUser(currentUserId);
      if (user.role !== 'admin' && user.role !== 'operador') {
        throw new Error('Acesso negado (admin/operador)');
      }
      const db = getDb();
      db.clientes = db.clientes.filter((x) => x.id !== id);
      setDb(db);
    },
  },

  boletins: {
    list(currentUserId: string, filters?: { status?: BoletimStatus | 'todos'; bairroId?: string | 'todos' }): Boletim[] {
      const user = requireUser(currentUserId);
      const db = getDb();
      let rows = db.boletins.slice();

      // visibilidade simples
      if (user.role === 'validador') {
        rows = rows.filter((b) => b.associacaoId === user.associacaoId);
      }

      if (filters?.status && filters.status !== 'todos') rows = rows.filter((b) => b.status === filters.status);
      if (filters?.bairroId && filters.bairroId !== 'todos') rows = rows.filter((b) => b.bairroId === filters.bairroId);

      rows.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
      return rows;
    },

    getById(currentUserId: string, id: string): { boletim: Boletim; itens: BoletimItem[] } {
      const user = requireUser(currentUserId);
      const db = getDb();
      const boletim = db.boletins.find((b) => b.id === id);
      if (!boletim) throw new Error('Boletim não encontrado');
      if (user.role === 'validador' && boletim.associacaoId !== user.associacaoId) {
        throw new Error('Acesso negado');
      }
      return { boletim, itens: db.boletimItens.filter((x) => x.boletimId === id) };
    },

    create(
      currentUserId: string,
      data: Omit<Boletim, 'id' | 'status' | 'criadoEm' | 'atualizadoEm' | 'criadoPorUserId'> & {
        itens: Array<Omit<BoletimItem, 'id' | 'boletimId' | 'criadoEm'>>;
      },
    ): Boletim {
      const user = requireUser(currentUserId);
      assertAdminOrOperador(user);
      const db = getDb();
      const ts = nowIso();
      const boletimId = uid('bol');
      const boletim: Boletim = {
        id: boletimId,
        titulo: data.titulo,
        bairroId: data.bairroId,
        associacaoId: data.associacaoId,
        tipo: data.tipo,
        status: 'rascunho',
        criadoPorUserId: user.id,
        criadoEm: ts,
        atualizadoEm: ts,
      };
      db.boletins.unshift(boletim);
      for (const it of data.itens) {
        db.boletimItens.unshift({
          id: uid('item'),
          boletimId,
          secao: it.secao,
          titulo: it.titulo,
          conteudo: it.conteudo,
          criadoEm: ts,
        });
      }
      setDb(db);
      return boletim;
    },

    update(
      currentUserId: string,
      id: string,
      patch: Partial<Omit<Boletim, 'id' | 'criadoPorUserId' | 'criadoEm'>> & {
        itens?: Array<Omit<BoletimItem, 'id' | 'boletimId' | 'criadoEm'>>;
      },
    ): Boletim {
      const user = requireUser(currentUserId);
      assertAdminOrOperador(user);
      const db = getDb();
      const idx = db.boletins.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Boletim não encontrado');

      const prev = db.boletins[idx];
      if (prev.status !== 'rascunho' && prev.status !== 'rejeitado') {
        throw new Error('Somente rascunhos ou rejeitados podem ser editados');
      }

      db.boletins[idx] = { ...prev, ...patch, atualizadoEm: nowIso() };

      if (patch.itens) {
        db.boletimItens = db.boletimItens.filter((x) => x.boletimId !== id);
        const ts = nowIso();
        for (const it of patch.itens) {
          db.boletimItens.unshift({
            id: uid('item'),
            boletimId: id,
            secao: it.secao,
            titulo: it.titulo,
            conteudo: it.conteudo,
            criadoEm: ts,
          });
        }
      }

      setDb(db);
      return db.boletins[idx];
    },

    delete(currentUserId: string, id: string): void {
      const user = requireUser(currentUserId);
      assertAdminOrOperador(user);
      const db = getDb();
      db.boletins = db.boletins.filter((x) => x.id !== id);
      db.boletimItens = db.boletimItens.filter((x) => x.boletimId !== id);
      setDb(db);
    },

    submitForApproval(currentUserId: string, id: string): Boletim {
      const user = requireUser(currentUserId);
      assertAdminOrOperador(user);
      const db = getDb();
      const idx = db.boletins.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Boletim não encontrado');
      const b = db.boletins[idx];
      if (b.status !== 'rascunho' && b.status !== 'rejeitado') {
        throw new Error('Apenas rascunho/rejeitado pode ir para validação');
      }
      db.boletins[idx] = { ...b, status: 'pendente_validacao', atualizadoEm: nowIso(), rejeitadoMotivo: undefined };
      setDb(db);
      return db.boletins[idx];
    },

    approve(currentUserId: string, id: string, aprovadoPorUserId: string): Boletim {
      const user = requireUser(currentUserId);
      assertValidador(user);
      const db = getDb();
      const idx = db.boletins.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Boletim não encontrado');
      const b = db.boletins[idx];
      if (b.status !== 'pendente_validacao') throw new Error('Boletim não está pendente');
      if (!user.associacaoId || b.associacaoId !== user.associacaoId) {
        throw new Error('Você só pode aprovar boletins da sua associação');
      }
      const ts = nowIso();
      db.boletins[idx] = { ...b, status: 'aprovado', aprovadoPorUserId, aprovadoEm: ts, atualizadoEm: ts, rejeitadoMotivo: undefined };
      setDb(db);
      return db.boletins[idx];
    },

    reject(currentUserId: string, id: string, _rejeitadoPorUserId: string, motivo: string): Boletim {
      const user = requireUser(currentUserId);
      assertValidador(user);
      const db = getDb();
      const idx = db.boletins.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Boletim não encontrado');
      const b = db.boletins[idx];
      if (b.status !== 'pendente_validacao') throw new Error('Boletim não está pendente');
      if (!user.associacaoId || b.associacaoId !== user.associacaoId) {
        throw new Error('Você só pode rejeitar boletins da sua associação');
      }
      const ts = nowIso();
      db.boletins[idx] = { ...b, status: 'rejeitado', aprovadoPorUserId: undefined, aprovadoEm: undefined, rejeitadoMotivo: motivo, atualizadoEm: ts };
      setDb(db);
      return db.boletins[idx];
    },

    send(currentUserId: string, id: string): { boletim: Boletim; log: EnvioLog } {
      const user = requireUser(currentUserId);
      assertAdminOrOperador(user);
      const db = getDb();
      const idx = db.boletins.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error('Boletim não encontrado');
      const b = db.boletins[idx];
      if (b.status !== 'aprovado') throw new Error('Apenas boletim aprovado pode ser disparado');

      const clientes = db.clientes.filter((c) => c.bairroId === b.bairroId && c.ativo);
      const total = clientes.length;
      // mock simples: falha aleatória leve
      const falha = total === 0 ? 0 : Math.floor(total * 0.1);
      const sucesso = total - falha;

      const ts = nowIso();
      const log: EnvioLog = {
        id: uid('env'),
        boletimId: id,
        data: ts,
        total,
        sucesso,
        falha,
      };
      db.envios.unshift(log);
      db.boletins[idx] = { ...b, status: 'enviado', atualizadoEm: ts };
      setDb(db);
      return { boletim: db.boletins[idx], log };
    },
  },

  envios: {
    list(currentUserId: string): EnvioLog[] {
      requireUser(currentUserId);
      // todos logados podem ver, MVP
      return getDb().envios.slice().sort((a, b) => b.data.localeCompare(a.data));
    },
  },

  lookups: {
    listBairros(): Bairro[] {
      return getDb().bairros;
    },
    listAssociacoes(): Associacao[] {
      return getDb().associacoes;
    },
    listUsuarios(): Omit<Usuario, 'senha'>[] {
      return getDb().usuarios.map(pickPublicUser);
    },
  },
};
