import { createDoc, ensureNodeIds } from '@codemerge/kernel';
import type { DocNode, Operation } from '@codemerge/kernel';
import type { CollabStore, NamedVersion, RoomRecord } from './types';

export function memoryStore(): CollabStore {
  const rooms = new Map<string, RoomRecord>();
  const versions = new Map<string, NamedVersion[]>();

  return {
    async loadRoom(docId) {
      return rooms.get(docId) ?? null;
    },
    async saveRoom(room) {
      rooms.set(room.docId, {
        ...room,
        ops: room.ops.slice(),
        snapshot: room.snapshot,
      });
    },
    async appendOps(docId, ops, snapshot, newVersion) {
      const prev = rooms.get(docId) ?? {
        docId,
        version: 0,
        snapshot: ensureNodeIds(createDoc()),
        ops: [] as Operation[],
        updatedAt: Date.now(),
      };
      rooms.set(docId, {
        docId,
        version: newVersion,
        snapshot,
        ops: [...prev.ops, ...ops],
        updatedAt: Date.now(),
      });
    },
    async listOpsSince(docId, sinceVersion) {
      const room = rooms.get(docId);
      if (!room) {
        return [];
      }
      return room.ops.slice(sinceVersion);
    },
    async compactSnapshot(docId, keepLastOps = 100) {
      const room = rooms.get(docId);
      if (!room) {
        return null;
      }
      const keep = Math.max(0, keepLastOps);
      const trimmed = room.ops.slice(Math.max(0, room.ops.length - keep));
      const next: RoomRecord = {
        ...room,
        ops: trimmed,
        updatedAt: Date.now(),
      };
      rooms.set(docId, next);
      return next;
    },
    async listVersions(docId) {
      return (versions.get(docId) ?? []).slice();
    },
    async saveVersion(docId, name) {
      const room = rooms.get(docId);
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
      const list = versions.get(docId) ?? [];
      list.push(entry);
      versions.set(docId, list);
      return entry;
    },
  };
}

export function emptyRoom(docId: string, snapshot?: DocNode): RoomRecord {
  return {
    docId,
    version: 0,
    snapshot: ensureNodeIds(snapshot ?? createDoc()),
    ops: [],
    updatedAt: Date.now(),
  };
}
