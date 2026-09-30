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
  | { type: 'join'; docId: string; snapshot?: unknown }
  | { type: 'submit'; docId: string; baseVersion: number; ops: unknown[]; clientSeq?: number }
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

export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (typeof raw !== 'object' || raw === null || !('type' in raw)) {
    return null;
  }
  const type = Reflect.get(raw, 'type');
  if (typeof type !== 'string') {
    return null;
  }
  return raw as ClientMessage;
}
