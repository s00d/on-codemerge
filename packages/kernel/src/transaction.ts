import type { DocNode, Selection } from './types';
import { createDoc } from './document';
import { clampSelection, collapsedAt } from './selection';
import { applyOps } from './operations';
import type { Operation } from './operations';
import { normalize } from './normalize';
import type { Schema } from './schema';

export interface EditorState {
  doc: DocNode;
  selection: Selection;
}

export interface Transaction {
  ops: Operation[];
  meta?: Record<string, unknown>;
}

export function createState(doc: DocNode = createDoc(), selection?: Selection): EditorState {
  const normalized = normalize(doc);
  const sel = selection ?? collapsedAt([0], 0);
  return {
    doc: normalized,
    selection: clampSelection(normalized, sel),
  };
}

export function applyTransaction(
  state: EditorState,
  tr: Transaction,
  schema?: Schema
): { state: EditorState; inverses: Operation[] } {
  const { doc, selection, inverses } = applyOps(state.doc, tr.ops, state.selection, schema);
  return {
    inverses,
    state: { doc: normalize(doc), selection },
  };
}

export function transaction(...ops: Operation[]): Transaction {
  return { ops };
}
