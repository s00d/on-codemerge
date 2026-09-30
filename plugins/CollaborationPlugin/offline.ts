/** IndexedDB queue for unacked local ops while offline. */

const DB_NAME = 'ocm-collab-offline';
const STORE = 'pending';

export type PendingBatch = {
  id: string;
  docId: string;
  baseVersion: number;
  ops: unknown[];
  clientSeq: number;
  at: number;
};

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

export async function enqueuePending(batch: PendingBatch): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(batch);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('idb_put'));
    });
    db.close();
  } catch {
    /* ignore when IDB unavailable */
  }
}

export async function listPending(docId: string): Promise<PendingBatch[]> {
  try {
    const db = await openDb();
    const all = await new Promise<PendingBatch[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as PendingBatch[]) ?? []);
      req.onerror = () => reject(req.error ?? new Error('idb_get'));
    });
    db.close();
    return all.filter((b) => b.docId === docId).sort((a, b) => a.clientSeq - b.clientSeq);
  } catch {
    return [];
  }
}

export async function removePending(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('idb_del'));
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export async function clearPending(docId: string): Promise<void> {
  const list = await listPending(docId);
  await Promise.all(list.map((b) => removePending(b.id)));
}
