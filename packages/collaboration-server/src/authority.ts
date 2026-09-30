import {
  applyOps,
  ensureNodeIds,
  rebaseOps,
  type DocNode,
  type Operation,
} from '@codemerge/kernel';
import type { RoomRecord } from './store/types';

export type SubmitResult =
  | {
      ok: true;
      version: number;
      ops: Operation[];
      snapshot: DocNode;
      serverOpsApplied: Operation[];
    }
  | {
      ok: false;
      reason: string;
      resync?: { version: number; snapshot: DocNode };
    };

function isOperation(v: unknown): v is Operation {
  return (
    typeof v === 'object' && v !== null && 'type' in v && typeof Reflect.get(v, 'type') === 'string'
  );
}

export function sanitizeOps(raw: unknown[]): Operation[] {
  return raw.filter(isOperation).filter((o) => o.type !== 'set_selection');
}

/**
 * Authoritative accept: rebase client ops onto room tip when baseVersion lags,
 * apply, bump version by op count.
 */
export function acceptSubmit(
  room: RoomRecord,
  baseVersion: number,
  rawOps: unknown[]
): SubmitResult {
  const ops = sanitizeOps(rawOps);
  if (ops.length === 0) {
    return { ok: false, reason: 'empty_ops' };
  }
  if (baseVersion > room.version) {
    return {
      ok: false,
      reason: 'future_base',
      resync: { version: room.version, snapshot: room.snapshot },
    };
  }
  if (baseVersion < 0) {
    return {
      ok: false,
      reason: 'bad_base',
      resync: { version: room.version, snapshot: room.snapshot },
    };
  }

  const serverSince = room.ops.slice(baseVersion);
  let toApply = ops;
  if (serverSince.length > 0) {
    toApply = rebaseOps(ops, serverSince);
  }
  if (toApply.length === 0) {
    return { ok: false, reason: 'noop_after_rebase' };
  }

  try {
    const selection = {
      anchor: { path: [0], offset: 0 },
      focus: { path: [0], offset: 0 },
    };
    const { doc } = applyOps(room.snapshot, toApply, selection);
    const snapshot = ensureNodeIds(doc);
    const version = room.version + toApply.length;
    return {
      ok: true,
      version,
      ops: toApply,
      snapshot,
      serverOpsApplied: toApply,
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'apply_failed',
      resync: { version: room.version, snapshot: room.snapshot },
    };
  }
}
