/** IndexedDB copy of the unconfirmed local edits, so a reload / crash while offline keeps them. */

const DB_NAME = 'ocm-collab-offline';
const STORE = 'pending';

/**
 * One record per `docId` + `clientId`. `outstanding` was sent and is unacked; `buffer` is
 * not sent yet. Both are relative to the server doc at `baseVersion` (buffer after outstanding).
 */
export type PendingState = {
  id: string;
  docId: string;
  clientId: string;
  baseVersion: number;
  outstanding: { seq: number; ops: unknown[] } | null;
  buffer: unknown[];
  clientSeq: number;
  at: number;
};

export function pendingId(docId: string, clientId: string): string {
  return `p_${docId}_${clientId}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('no_indexeddb'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('idb_open'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest | undefined
): Promise<T | undefined> {
  try {
    const db = await openDb();
    const result = await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req?.result as T | undefined);
      tx.onerror = () => reject(tx.error ?? new Error('idb_tx'));
    });
    db.close();
    return result;
  } catch {
    // IndexedDB unavailable (SSR, private mode): the queue is best-effort.
    return undefined;
  }
}

export async function savePending(state: PendingState): Promise<void> {
  await withStore('readwrite', (s) => s.put(state));
}

export async function loadPending(id: string): Promise<PendingState | null> {
  const row = await withStore<PendingState>('readonly', (s) => s.get(id));
  return row && Array.isArray(row.buffer) ? row : null;
}

export async function clearPending(id: string): Promise<void> {
  await withStore('readwrite', (s) => {
    s.delete(id);
    return undefined;
  });
}
