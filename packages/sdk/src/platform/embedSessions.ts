import type { EditorAPI } from '../types';

/** Per-editor WeakMap of path-keyed embed sessions (table/json/md). */
export type EmbedSessionStore<T> = {
  forEditor(editor: EditorAPI): Map<string, T>;
  prune(editor: EditorAPI, keep: Iterable<string>, destroy?: (session: T) => void): void;
  clear(editor: EditorAPI, destroy?: (session: T) => void): void;
};

export function createEmbedSessionStore<T>(): EmbedSessionStore<T> {
  const byEditor = new WeakMap<EditorAPI, Map<string, T>>();
  return {
    forEditor(editor) {
      let map = byEditor.get(editor);
      if (!map) {
        map = new Map();
        byEditor.set(editor, map);
      }
      return map;
    },
    prune(editor, keep, destroy) {
      const map = byEditor.get(editor);
      if (!map) {
        return;
      }
      const keepSet = keep instanceof Set ? keep : new Set(keep);
      for (const [key, session] of map) {
        if (!keepSet.has(key)) {
          destroy?.(session);
          map.delete(key);
        }
      }
    },
    clear(editor, destroy) {
      const map = byEditor.get(editor);
      if (!map) {
        return;
      }
      if (destroy) {
        for (const session of map.values()) {
          destroy(session);
        }
      }
      map.clear();
      byEditor.delete(editor);
    },
  };
}
