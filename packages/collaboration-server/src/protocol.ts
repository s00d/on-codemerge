/** Protocol version for CodeMerge collaboration wire format. */
export const PROTOCOL_VERSION = 2 as const;

export type CollabRole = 'read' | 'write' | 'comment';

export type PresenceState = {
  userId: string;
  name?: string;
  color?: string;
  selection?: {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  };
  cursor?: { path: number[]; offset: number };
  updatedAt: number;
};

export type ClientMessage =
  | { type: 'hello'; protocolVersion: number }
  | { type: 'auth'; token: string; userId?: string }
  | {
      type: 'join';
      docId: string;
      snapshot?: unknown;
      /** Client's last confirmed version: `init` then carries the ops since it (catch-up). */
      sinceVersion?: number;
      clientId?: string;
    }
  | {
      type: 'submit';
      docId: string;
      baseVersion: number;
      ops: unknown[];
      clientSeq?: number;
      /** Stable per client instance (survives reload via the offline queue); enables resubmit dedupe. */
      clientId?: string;
    }
  | { type: 'presence'; docId: string; state: Omit<PresenceState, 'userId' | 'updatedAt'> }
  | { type: 'ping'; ts?: number }
  | { type: 'leave'; docId: string }
  | {
      type: 'comment';
      docId: string;
      action: 'add' | 'resolve' | 'remove';
      thread: {
        id: string;
        body: string;
        authorId: string;
        anchor: { nodeId?: string; path: number[]; from: number; to: number };
        createdAt: number;
        resolved?: boolean;
      };
    };

/** Ops `(from, to]` of the op-log came from the batch with this clientSeq. */
export type AckedBatch = { seq: number; from: number; to: number };

/** Server → client */
export type ServerMessage =
  | {
      type: 'hello_ok';
      protocolVersion: number;
      caps: string[];
    }
  | {
      type: 'auth_ok';
      userId: string;
      role: CollabRole;
    }
  | { type: 'auth_fail'; reason: string }
  | {
      type: 'init';
      docId: string;
      version: number;
      snapshot: unknown;
      peers?: PresenceState[];
      /** Ops `(sinceVersion, version]` when the join asked for them and the log still has them. */
      ops?: unknown[];
      /** Last batch applied for the joiner's `clientId` (ack may have been lost on a dropped socket). */
      acked?: AckedBatch;
    }
  | {
      type: 'ack';
      docId: string;
      version: number;
      ops: unknown[];
      clientSeq?: number;
      authorId: string;
    }
  | {
      type: 'reject';
      docId: string;
      reason: string;
      clientSeq?: number;
      resync?: { version: number; snapshot: unknown };
    }
  | {
      type: 'presence';
      docId: string;
      peers: PresenceState[];
    }
  | { type: 'pong'; ts?: number }
  | { type: 'error'; reason: string }
  | {
      type: 'comment';
      docId: string;
      threads: Array<{
        id: string;
        body: string;
        authorId: string;
        anchor: { nodeId?: string; path: number[]; from: number; to: number };
        createdAt: number;
        resolved?: boolean;
      }>;
    };

const isObj = (v: unknown): v is object => typeof v === 'object' && v !== null;
const isStr = (v: unknown): v is string => typeof v === 'string';

/** Shape-check untrusted client JSON: every field the server dereferences must be present. */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (!isObj(raw)) {
    return null;
  }
  const get = (k: string): unknown => Reflect.get(raw, k);
  switch (get('type')) {
    case 'hello':
    case 'ping':
      break;
    case 'auth':
      if (!isStr(get('token'))) {
        return null;
      }
      break;
    case 'join':
      if (!isStr(get('docId'))) {
        return null;
      }
      if (get('sinceVersion') !== undefined && typeof get('sinceVersion') !== 'number') {
        return null;
      }
      if (get('clientId') !== undefined && !isStr(get('clientId'))) {
        return null;
      }
      break;
    case 'leave':
      if (!isStr(get('docId'))) {
        return null;
      }
      break;
    case 'submit':
      if (!isStr(get('docId')) || typeof get('baseVersion') !== 'number') {
        return null;
      }
      if (!Array.isArray(get('ops'))) {
        return null;
      }
      if (get('clientSeq') !== undefined && typeof get('clientSeq') !== 'number') {
        return null;
      }
      if (get('clientId') !== undefined && !isStr(get('clientId'))) {
        return null;
      }
      break;
    case 'presence':
      if (!isStr(get('docId')) || !isObj(get('state'))) {
        return null;
      }
      break;
    case 'comment': {
      const thread = get('thread');
      const action = get('action');
      if (!isStr(get('docId')) || !isObj(thread) || !isStr(Reflect.get(thread, 'id'))) {
        return null;
      }
      if (action !== 'add' && action !== 'resolve' && action !== 'remove') {
        return null;
      }
      break;
    }
    default:
      return null;
  }
  return raw as ClientMessage;
}
