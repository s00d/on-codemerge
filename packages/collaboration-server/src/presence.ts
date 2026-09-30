import type { PresenceState } from './protocol';

export class PresenceHub {
  private readonly byDoc = new Map<string, Map<string, PresenceState>>();

  set(
    docId: string,
    userId: string,
    partial: Omit<PresenceState, 'userId' | 'updatedAt'>
  ): PresenceState[] {
    let map = this.byDoc.get(docId);
    if (!map) {
      map = new Map();
      this.byDoc.set(docId, map);
    }
    const state: PresenceState = {
      ...partial,
      userId,
      updatedAt: Date.now(),
    };
    map.set(userId, state);
    return [...map.values()];
  }

  remove(docId: string, userId: string): PresenceState[] {
    const map = this.byDoc.get(docId);
    if (!map) {
      return [];
    }
    map.delete(userId);
    if (map.size === 0) {
      this.byDoc.delete(docId);
      return [];
    }
    return [...map.values()];
  }

  removeFromAll(userId: string): string[] {
    const touched: string[] = [];
    for (const [docId, map] of this.byDoc) {
      if (map.delete(userId)) {
        touched.push(docId);
        if (map.size === 0) {
          this.byDoc.delete(docId);
        }
      }
    }
    return touched;
  }

  list(docId: string): PresenceState[] {
    return [...(this.byDoc.get(docId)?.values() ?? [])];
  }
}
