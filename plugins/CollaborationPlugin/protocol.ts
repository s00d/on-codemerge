export const PROTOCOL_VERSION = 2 as const;

export type CollabStatus =
  | 'idle'
  | 'connecting'
  | 'authenticating'
  | 'syncing'
  | 'synced'
  | 'reconnecting'
  | 'readonly'
  | 'offline'
  | 'error';

export type PresencePeer = {
  userId: string;
  name?: string;
  color?: string;
  selection?: {
    anchor: { path: number[]; offset: number };
    focus: { path: number[]; offset: number };
  };
  cursor?: { path: number[]; offset: number };
  updatedAt?: number;
};

export type CommentAnchor = {
  nodeId?: string;
  path: number[];
  from: number;
  to: number;
};

export type CommentThread = {
  id: string;
  body: string;
  authorId: string;
  anchor: CommentAnchor;
  createdAt: number;
  resolved?: boolean;
};

export type ClientWire =
  | { type: 'hello'; protocolVersion: number }
  | { type: 'auth'; token: string; userId?: string }
  | { type: 'join'; docId: string; snapshot?: unknown }
  | { type: 'submit'; docId: string; baseVersion: number; ops: unknown[]; clientSeq?: number }
  | { type: 'presence'; docId: string; state: Omit<PresencePeer, 'userId' | 'updatedAt'> }
  | { type: 'ping'; ts?: number }
  | { type: 'leave'; docId: string }
  | {
      type: 'comment';
      docId: string;
      action: 'add' | 'resolve' | 'remove';
      thread: CommentThread;
    };

export type ServerWire =
  | { type: 'hello_ok'; protocolVersion: number; caps?: string[] }
  | { type: 'auth_ok'; userId: string; role: string }
  | { type: 'auth_fail'; reason: string }
  | { type: 'init'; docId: string; version: number; snapshot: unknown; peers?: PresencePeer[] }
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
  | { type: 'presence'; docId: string; peers: PresencePeer[] }
  | { type: 'pong'; ts?: number }
  | { type: 'error'; reason: string }
  | { type: 'comment'; docId: string; threads: CommentThread[] };

export function parseServerWire(raw: unknown): ServerWire | null {
  if (typeof raw !== 'object' || raw === null || !('type' in raw)) {
    return null;
  }
  if (typeof Reflect.get(raw, 'type') !== 'string') {
    return null;
  }
  return raw as ServerWire;
}
