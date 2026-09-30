import type { CollabStore, NamedVersion, RoomRecord } from './types';
import type { DocNode, Operation } from '@codemerge/kernel';
import { ensureNodeIds, createDoc } from '@codemerge/kernel';

/**
 * Postgres store adapter (optional peer `pg`).
 * Expects tables created via `postgresMigrate(client)`.
 */
export type PostgresPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  end?: () => Promise<void>;
};

export async function postgresMigrate(pool: PostgresPool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ocm_collab_rooms (
      doc_id TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      snapshot JSONB NOT NULL,
      ops JSONB NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ocm_collab_versions (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      name TEXT NOT NULL,
      version INTEGER NOT NULL,
      snapshot JSONB NOT NULL,
      created_at BIGINT NOT NULL
    );
  `);
}

export function postgresStore(pool: PostgresPool): CollabStore {
  return {
    async loadRoom(docId) {
      const { rows } = await pool.query(
        'SELECT doc_id, version, snapshot, ops, updated_at FROM ocm_collab_rooms WHERE doc_id = $1',
        [docId]
      );
      const row = rows[0];
      if (!row) {
        return null;
      }
      return {
        docId: String(row.doc_id),
        version: Number(row.version),
        snapshot: ensureNodeIds(row.snapshot as DocNode),
        ops: row.ops as Operation[],
        updatedAt: Number(row.updated_at),
      };
    },
    async saveRoom(room) {
      await pool.query(
        `INSERT INTO ocm_collab_rooms (doc_id, version, snapshot, ops, updated_at)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)
         ON CONFLICT (doc_id) DO UPDATE SET
           version = EXCLUDED.version,
           snapshot = EXCLUDED.snapshot,
           ops = EXCLUDED.ops,
           updated_at = EXCLUDED.updated_at`,
        [
          room.docId,
          room.version,
          JSON.stringify(room.snapshot),
          JSON.stringify(room.ops),
          room.updatedAt,
        ]
      );
    },
    async appendOps(docId, ops, snapshot, newVersion) {
      const prev = await this.loadRoom(docId);
      await this.saveRoom({
        docId,
        version: newVersion,
        snapshot,
        ops: [...(prev?.ops ?? []), ...ops],
        updatedAt: Date.now(),
      });
    },
    async listOpsSince(docId, sinceVersion) {
      const room = await this.loadRoom(docId);
      return room ? room.ops.slice(sinceVersion) : [];
    },
    async compactSnapshot(docId, keepLastOps = 100) {
      const room = await this.loadRoom(docId);
      if (!room) {
        return null;
      }
      const next: RoomRecord = {
        ...room,
        ops: room.ops.slice(Math.max(0, room.ops.length - Math.max(0, keepLastOps))),
        updatedAt: Date.now(),
      };
      await this.saveRoom(next);
      return next;
    },
    async listVersions(docId) {
      const { rows } = await pool.query(
        'SELECT id, name, version, snapshot, created_at FROM ocm_collab_versions WHERE doc_id = $1 ORDER BY created_at',
        [docId]
      );
      return rows.map((r): NamedVersion => ({
        id: String(r.id),
        name: String(r.name),
        version: Number(r.version),
        snapshot: r.snapshot as DocNode,
        createdAt: Number(r.created_at),
      }));
    },
    async saveVersion(docId, name) {
      const room = await this.loadRoom(docId);
      if (!room) {
        return null;
      }
      const entry: NamedVersion = {
        id: `v_${Date.now()}`,
        name,
        version: room.version,
        snapshot: room.snapshot,
        createdAt: Date.now(),
      };
      await pool.query(
        `INSERT INTO ocm_collab_versions (id, doc_id, name, version, snapshot, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
        [
          entry.id,
          docId,
          entry.name,
          entry.version,
          JSON.stringify(entry.snapshot),
          entry.createdAt,
        ]
      );
      return entry;
    },
    async close() {
      await pool.end?.();
    },
  };
}

export function postgresEmptyDoc(): DocNode {
  return ensureNodeIds(createDoc());
}
