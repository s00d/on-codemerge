import type { Operation } from './operations';
import { applyTransaction, createState, transaction } from './transaction';
import type { EditorState, Transaction } from './transaction';
import type { Schema } from './schema';

export interface HistoryOptions {
  maxDepth?: number;
  /** Merge window in ms for consecutive typing */
  mergeWindowMs?: number;
  /** Cap merged typing entry size (insert+delete char counts); stop merging when exceeded. */
  maxEntryChars?: number;
  /** When set, applyTransaction validates ops against this schema. */
  schema?: Schema;
}

/** Result of one undo/redo step: the new state plus the doc ops that produced it (empty = nothing to do). */
export interface HistoryStep {
  state: EditorState;
  ops: Operation[];
}

export interface HistoryController {
  apply: (state: EditorState, tr: Transaction, now?: number) => EditorState;
  undo: (state: EditorState) => EditorState;
  redo: (state: EditorState) => EditorState;
  /** Like `undo`, also returning the applied ops (collab must broadcast them). */
  undoStep: (state: EditorState) => HistoryStep;
  /** Like `redo`, also returning the applied ops. */
  redoStep: (state: EditorState) => HistoryStep;
  canUndo: () => boolean;
  canRedo: () => boolean;
  depth: () => number;
  /** Drop stacks after out-of-band full-document replace (setJSON / replaceDocument). */
  clear: () => void;
}

interface Entry {
  inverses: Operation[];
  redo: Operation[];
  /** Final selection after the transaction (caret metadata; not replayed as ops). */
  selection: EditorState['selection'];
  at: number;
  chars: number;
}

export function createHistory(options: HistoryOptions = {}): HistoryController {
  const maxDepth = options.maxDepth ?? 100,
    mergeWindowMs = options.mergeWindowMs ?? 500,
    maxEntryChars = options.maxEntryChars ?? 10_000,
    schema = options.schema,
    undoStack: Entry[] = [],
    redoStack: Entry[] = [];
  // After undo/redo the top entry is a boundary: next typing starts a new entry.
  let mergeBlocked = false;

  function push(entry: Entry): void {
    const last = undoStack.at(-1);
    if (
      last &&
      !mergeBlocked &&
      entry.at - last.at <= mergeWindowMs &&
      isTyping(entry.redo) &&
      isTyping(last.redo) &&
      last.chars + entry.chars <= maxEntryChars
    ) {
      last.redo = [...last.redo, ...entry.redo];
      last.inverses = [...entry.inverses, ...last.inverses];
      last.selection = entry.selection;
      last.at = entry.at;
      last.chars += entry.chars;
    } else {
      undoStack.push(entry);
    }
    mergeBlocked = false;
    while (undoStack.length > maxDepth) {
      undoStack.shift();
    }
    redoStack.length = 0;
  }

  function undoStep(state: EditorState): HistoryStep {
    const entry = undoStack.pop();
    if (!entry) {
      return { state, ops: [] };
    }
    const { state: next } = applyTransaction(state, transaction(...entry.inverses), schema);
    redoStack.push(entry);
    mergeBlocked = true;
    return { state: next, ops: entry.inverses };
  }

  function redoStep(state: EditorState): HistoryStep {
    const entry = redoStack.pop();
    if (!entry) {
      return { state, ops: [] };
    }
    const { state: next, inverses } = applyTransaction(state, transaction(...entry.redo), schema);
    undoStack.push({
      inverses,
      redo: entry.redo,
      selection: entry.selection,
      at: Date.now(),
      chars: entry.chars,
    });
    mergeBlocked = true;
    return { state: { ...next, selection: entry.selection }, ops: entry.redo };
  }

  return {
    apply(state, tr, now = Date.now()) {
      const { state: next, inverses } = applyTransaction(state, tr, schema);
      if (tr.ops.some((op) => op.type !== 'set_selection')) {
        const redo = tr.ops.filter((o) => o.type !== 'set_selection');
        push({
          inverses,
          redo,
          selection: next.selection,
          at: now,
          chars: entryCharCount(redo),
        });
      }
      return next;
    },
    canRedo: () => redoStack.length > 0,
    canUndo: () => undoStack.length > 0,
    clear() {
      undoStack.length = 0;
      redoStack.length = 0;
    },
    depth: () => undoStack.length,
    redo: (state) => redoStep(state).state,
    redoStep,
    undo: (state) => undoStep(state).state,
    undoStep,
  };
}

function isTyping(ops: Operation[]): boolean {
  return ops.length > 0 && ops.every((o) => o.type === 'insert_text' || o.type === 'delete_text');
}

function entryCharCount(ops: Operation[]): number {
  let n = 0;
  for (const op of ops) {
    if (op.type === 'insert_text') {
      n += op.text.length;
    } else if (op.type === 'delete_text') {
      n += op.length;
    }
  }
  return n;
}

export function emptyState(): EditorState {
  return createState();
}
