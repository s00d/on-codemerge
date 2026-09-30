import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createDoc, ensureNodeIds } from '@codemerge/kernel';
import type { DocNode, Operation } from '@codemerge/kernel';
import type { CollabStore, NamedVersion, RoomRecord } from './types';

export type SqliteStoreOptions = {
  path: string;
};

type SqlValue = null | number | bigint | string | Uint8Array | Buffer;

type SqliteStatement = {
  get: (...params: SqlValue[]) => unknown;
  all: (...params: SqlValue[]) => unknown[];
  run: (...params: SqlValue[]) => unknown;
};

type DatabaseSyncCtor = new (
  path: string,
  options?: unknown
) => {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  close: () => void;
};

function loadDatabaseSync(): DatabaseSyncCtor {
  const getBuiltin = (
    process as NodeJS.Process & {
      getBuiltinModule?: (id: string) => { DatabaseSync?: DatabaseSyncCtor } | undefined;
    }
  ).getBuiltinModule;
  if (typeof getBuiltin !== 'function') {
    throw new Error(
      'SQLite store requires Node.js >= 22.5 (node:sqlite). Use memoryStore() or upgrade Node.'
    );
  }
  const mod = getBuiltin('node:sqlite');
  if (!mod?.DatabaseSync) {
    throw new Error(
      'SQLite store requires Node.js >= 22.5 (node:sqlite). Use memoryStore() or upgrade Node.'
    );
  }
  return mod.DatabaseSync as DatabaseSyncCtor;
}

function rowToRoom(row: {
  doc_id: string;
  version: number;
  snapshot: string;
  ops: string;
  updated_at: number;
}): RoomRecord {
  return {
    docId: row.doc_id,
    version: row.version,
    snapshot: ensureNodeIds(JSON.parse(row.snapshot) as DocNode),
    ops: JSON.parse(row.ops) as Operation[],
    updatedAt: row.updated_at,
  };
}

export function sqliteStore(opts: SqliteStoreOptions): CollabStore {
  const DatabaseSync = loadDatabaseSync();
  mkdirSync(dirname(opts.path), { recursive: true });
  const db = new DatabaseSync(opts.path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      doc_id TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      ops TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      name TEXT NOT NULL,
      version INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  return {
    async loadRoom(docId) {
      const row = db
        .prepare('SELECT doc_id, version, snapshot, ops, updated_at FROM rooms WHERE doc_id = ?')
        .get(docId) as
        | {
            doc_id: string;
            version: number;
            snapshot: string;
            ops: string;
            updated_at: number;
          }
        | undefined;
      return row ? rowToRoom(row) : null;
    },
    async saveRoom(room) {
      db.prepare(
        `INSERT INTO rooms (doc_id, version, snapshot, ops, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(doc_id) DO UPDATE SET
           version=excluded.version,
           snapshot=excluded.snapshot,
           ops=excluded.ops,
           updated_at=excluded.updated_at`
      ).run(
        room.docId,
        room.version,
        JSON.stringify(room.snapshot),
        JSON.stringify(room.ops),
        room.updatedAt
      );
    },
    async appendOps(docId, ops, snapshot, newVersion) {
      const prev = await this.loadRoom(docId);
      const nextOps = [...(prev?.ops ?? []), ...ops];
      await this.saveRoom({
        docId,
        version: newVersion,
        snapshot,
        ops: nextOps,
        updatedAt: Date.now(),
      });
    },
    async listOpsSince(docId, sinceVersion) {
      const room = await this.loadRoom(docId);
      if (!room) {
        return [];
      }
      return room.ops.slice(sinceVersion);
    },
    async compactSnapshot(docId, keepLastOps = 100) {
      const room = await this.loadRoom(docId);
      if (!room) {
        return null;
      }
      const keep = Math.max(0, keepLastOps);
      const next: RoomRecord = {
        ...room,
        ops: room.ops.slice(Math.max(0, room.ops.length - keep)),
        updatedAt: Date.now(),
      };
      await this.saveRoom(next);
      return next;
    },
    async listVersions(docId) {
      const rows = db
        .prepare(
          'SELECT id, doc_id, name, version, snapshot, created_at FROM versions WHERE doc_id = ? ORDER BY created_at'
        )
        .all(docId) as {
        id: string;
        doc_id: string;
        name: string;
        version: number;
        snapshot: string;
        created_at: number;
      }[];
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        version: r.version,
        snapshot: JSON.parse(r.snapshot) as DocNode,
        createdAt: r.created_at,
      }));
    },
    async saveVersion(docId, name) {
      const room = await this.loadRoom(docId);
      if (!room) {
        return null;
      }
      const entry: NamedVersion = {
        id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        version: room.version,
        snapshot: room.snapshot,
        createdAt: Date.now(),
      };
      db.prepare(
        `INSERT INTO versions (id, doc_id, name, version, snapshot, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        entry.id,
        docId,
        entry.name,
        entry.version,
        JSON.stringify(entry.snapshot),
        entry.createdAt
      );
      return entry;
    },
    close() {
      db.close();
    },
  };
}

export function defaultEmptySnapshot(): DocNode {
  return ensureNodeIds(createDoc());
}
