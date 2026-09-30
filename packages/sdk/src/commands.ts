import type { Command, DocNode, Operation, Selection } from '@codemerge/kernel';
import { isCollapsed, plainText } from '@codemerge/kernel';
import { core } from './core';
import type { EditorAPI } from './types';

/** Marks treated as visual styles (not links / comments / track-changes). */
const STYLE_MARK_TYPES = new Set([
  'bold',
  'italic',
  'underline',
  'strike',
  'textColor',
  'highlight',
  'fontFamily',
  'fontSize',
]);

const STYLE_BLOCK_ATTRS = ['style', 'align', 'lineHeight'] as const;

/** Coerce unknown attrs (e.g. widget props) to a string safely. */
export function attrString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

const WORD_CHAR = /[\p{L}\p{N}_]/u;

/** Expand caret offset to word bounds within plain text. */
export function expandOffsetToWord(text: string, offset: number): { from: number; to: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  if (!text) {
    return { from: 0, to: 0 };
  }
  const at = clamped < text.length ? text.charAt(clamped) : '';
  const before = clamped > 0 ? text.charAt(clamped - 1) : '';
  if (!WORD_CHAR.test(at) && !WORD_CHAR.test(before)) {
    return { from: clamped, to: clamped };
  }
  let from = clamped;
  let to = clamped;
  if (!WORD_CHAR.test(at) && WORD_CHAR.test(before)) {
    from = clamped - 1;
    to = clamped - 1;
  }
  while (from > 0 && WORD_CHAR.test(text.charAt(from - 1))) {
    from -= 1;
  }
  while (to < text.length && WORD_CHAR.test(text.charAt(to))) {
    to += 1;
  }
  return { from, to };
}

function blockPlainText(editor: EditorAPI, path: number[]): string {
  let node: DocNode | undefined = editor.getJSON().doc;
  for (const idx of path) {
    node = node?.content?.[idx];
  }
  if (!node?.content) {
    return '';
  }
  return node.content.map((c) => c.text ?? '').join('');
}

/** Prepare selection for mark/toolbar actions, then run callback.
 * Non-collapsed: keep current range. Collapsed: expand to word in current block.
 */
export function withMarkTarget(editor: EditorAPI, then: () => void): void {
  const sel = editor.getSelection();
  if (!isCollapsed(sel)) {
    then();
    return;
  }
  const path = [...sel.anchor.path];
  const text = blockPlainText(editor, path);
  const { from, to } = expandOffsetToWord(text, sel.anchor.offset);
  if (from !== to) {
    const next: Selection = {
      anchor: { offset: from, path: [...path] },
      focus: { offset: to, path: [...path] },
    };
    editor.setSelection(next);
  }
  then();
}

export function setMarkAttrs(markType: string, attrs: Record<string, unknown>): Command {
  return (state) => {
    const range = core.selectionTextRange(state.selection);
    if (!range || range.from === range.to) {
      return null;
    }
    return [
      {
        from: range.from,
        mark: { attrs, type: markType },
        path: range.path,
        to: range.to,
        type: 'set_mark',
      },
    ];
  };
}

const BLOCKISH = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'listItem',
  'table',
  'tableRow',
  'tableCell',
  'code_block',
  'codeBlock',
]);

function collectTextLeaves(node: DocNode, path: number[], out: number[][]): void {
  const kids = node.content ?? [];
  const hasBlockChild = kids.some((c) => BLOCKISH.has(c.type));
  if ((node.type === 'paragraph' || node.type === 'heading') && !hasBlockChild) {
    out.push([...path]);
    return;
  }
  kids.forEach((child, i) => {
    if (child.type === 'text') {
      return;
    }
    collectTextLeaves(child, [...path, i], out);
  });
}

function samePath(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function markTypesInRange(para: DocNode, from: number, to: number): string[] {
  const types = new Set<string>();
  let pos = 0;
  for (const child of para.content ?? []) {
    if (child.type !== 'text' || typeof child.text !== 'string') {
      continue;
    }
    const len = child.text.length;
    const start = pos;
    const end = pos + len;
    pos = end;
    if (end <= from || start >= to) {
      continue;
    }
    for (const m of child.marks ?? []) {
      if (STYLE_MARK_TYPES.has(m.type)) {
        types.add(m.type);
      }
    }
  }
  return [...types];
}

function blockPaintPath(doc: DocNode, leafPath: number[]): number[] {
  const cell = findAncestorPath(doc, leafPath, 'tableCell');
  if (cell !== null) {
    return cell;
  }
  const listItem = findAncestorPath(doc, leafPath, 'listItem');
  if (listItem !== null) {
    return listItem;
  }
  return [leafPath[0] ?? 0];
}

function blockHasStyleAttrs(node: DocNode): boolean {
  const attrs = node.attrs ?? {};
  for (const key of STYLE_BLOCK_ATTRS) {
    const v = attrs[key];
    if (v !== undefined && v !== null && v !== '') {
      return true;
    }
  }
  return false;
}

/**
 * Clear visual styles: style marks + block style/align/lineHeight.
 * - Collapsed caret → whole document
 * - Non-empty selection → only covered text leaves / their paint hosts
 */
export function clearStyles(): Command {
  return (state) => {
    const ops: Operation[] = [];
    const { from, to } = core.orderedRange(state.selection);
    const collapsed = samePath(from.path, to.path) && from.offset === to.offset;
    const leaves: number[][] = [];
    collectTextLeaves(state.doc, [], leaves);
    if (leaves.length === 0) {
      return null;
    }

    type Span = { path: number[]; from: number; to: number };
    const spans: Span[] = [];

    if (collapsed) {
      for (const path of leaves) {
        let len = 0;
        try {
          len = plainText(core.getNodeAt(state.doc, path)).length;
        } catch {
          continue;
        }
        if (len > 0) {
          spans.push({ path, from: 0, to: len });
        }
      }
    } else if (samePath(from.path, to.path)) {
      if (from.offset !== to.offset) {
        spans.push({ path: from.path, from: from.offset, to: to.offset });
      }
    } else {
      const i0 = leaves.findIndex((p) => samePath(p, from.path));
      const i1 = leaves.findIndex((p) => samePath(p, to.path));
      if (i0 === -1 || i1 === -1) {
        return null;
      }
      const lo = Math.min(i0, i1);
      const hi = Math.max(i0, i1);
      for (let i = lo; i <= hi; i++) {
        const path = leaves[i];
        if (path === undefined) {
          continue;
        }
        let len = 0;
        try {
          len = plainText(core.getNodeAt(state.doc, path)).length;
        } catch {
          continue;
        }
        const start = samePath(path, from.path) ? from.offset : 0;
        const end = samePath(path, to.path) ? to.offset : len;
        if (end > start) {
          spans.push({ path, from: start, to: end });
        }
      }
    }

    const paintPaths = new Map<string, number[]>();
    for (const span of spans) {
      let para: DocNode;
      try {
        para = core.getNodeAt(state.doc, span.path);
      } catch {
        continue;
      }
      for (const markType of markTypesInRange(para, span.from, span.to)) {
        ops.push({
          type: 'remove_mark',
          path: span.path,
          from: span.from,
          to: span.to,
          markType,
        });
      }
      const paint = blockPaintPath(state.doc, span.path);
      paintPaths.set(paint.join('.'), paint);
    }

    if (collapsed) {
      // Also clear style attrs on every paint-capable block in the doc.
      const walk = (node: DocNode, path: number[]) => {
        if (
          (node.type === 'paragraph' ||
            node.type === 'heading' ||
            node.type === 'blockquote' ||
            node.type === 'listItem' ||
            node.type === 'tableCell') &&
          blockHasStyleAttrs(node)
        ) {
          paintPaths.set(path.join('.'), path);
        }
        (node.content ?? []).forEach((child, i) => {
          if (child.type !== 'text') {
            walk(child, [...path, i]);
          }
        });
      };
      walk(state.doc, []);
    }

    for (const path of paintPaths.values()) {
      let node: DocNode;
      try {
        node = core.getNodeAt(state.doc, path);
      } catch {
        continue;
      }
      if (!blockHasStyleAttrs(node)) {
        continue;
      }
      ops.push({
        type: 'set_attrs',
        path,
        attrs: { style: '', align: '', lineHeight: '' },
      });
    }

    return ops.length > 0 ? ops : null;
  };
}

export function setBlockAttr(key: string, value: unknown): Command {
  return (state) => {
    const selPath = state.selection.anchor.path;
    if (selPath.length === 0) {
      return null;
    }
    // Paint-aware host: tableCell (td), else listItem (li), else top-level block.
    const cell = findAncestorPath(state.doc, selPath, 'tableCell');
    if (cell !== null) {
      return [{ attrs: { [key]: value }, path: cell, type: 'set_attrs' }];
    }
    const listItem = findAncestorPath(state.doc, selPath, 'listItem');
    if (listItem !== null) {
      return [{ attrs: { [key]: value }, path: listItem, type: 'set_attrs' }];
    }
    const rootIndex = selPath[0] ?? 0;
    return [{ attrs: { [key]: value }, path: [rootIndex], type: 'set_attrs' }];
  };
}

function isListContainer(type: string): boolean {
  return type === 'bulletList' || type === 'orderedList';
}

/**
 * Change the caret block's type. Inside a list item: lift that item (split list),
 * then convert — never retype the whole list.
 */
export function convertBlockType(type: string, attrs: Record<string, unknown> = {}): Command {
  return (state) => {
    const selPath = state.selection.anchor.path;
    const listItemPath = findAncestorPath(state.doc, selPath, 'listItem');
    if (listItemPath !== null) {
      const listPath = listItemPath.slice(0, -1);
      const itemIndex = listItemPath.at(-1);
      if (itemIndex === undefined || listPath.length !== 1) {
        return null;
      }
      let list: DocNode;
      try {
        list = core.getNodeAt(state.doc, listPath);
      } catch {
        return null;
      }
      if (!isListContainer(list.type)) {
        return null;
      }
      const items = list.content ?? [];
      const item = items[itemIndex];
      if (item === undefined) {
        return null;
      }
      const before = items.slice(0, itemIndex);
      const after = items.slice(itemIndex + 1);
      const lifted: DocNode = {
        attrs: { ...attrs },
        content: [...(item.content ?? [core.createText('')])],
        id: `${type}_${Date.now()}`,
        type,
      };
      const listIndex = listPath[0] ?? 0;
      const ops: Operation[] = [{ type: 'remove_node', path: [], index: listIndex }];
      let insertAt = listIndex;
      if (before.length > 0) {
        ops.push({
          type: 'insert_node',
          path: [],
          index: insertAt,
          node: { ...list, content: before, id: `list_${Date.now()}_a` },
        });
        insertAt += 1;
      }
      ops.push({ type: 'insert_node', path: [], index: insertAt, node: lifted });
      const selectionPath = [insertAt];
      insertAt += 1;
      if (after.length > 0) {
        ops.push({
          type: 'insert_node',
          path: [],
          index: insertAt,
          node: { ...list, content: after, id: `list_${Date.now()}_b` },
        });
      }
      ops.push({
        type: 'set_selection',
        selection: core.collapsedAt(selectionPath, 0),
      });
      return ops;
    }

    if (selPath.length !== 1) {
      return null;
    }
    const index = selPath[0] ?? 0;
    let block: DocNode;
    try {
      block = core.getNodeAt(state.doc, [index]);
    } catch {
      return null;
    }
    if (isListContainer(block.type)) {
      return null;
    }
    const next: DocNode = {
      ...core.cloneNode(block),
      attrs: { ...block.attrs, ...attrs },
      type,
    };
    return [
      { index, node: next, path: [], type: 'insert_node' },
      { index: index + 1, path: [], type: 'remove_node' },
      {
        type: 'set_selection',
        selection: core.collapsedAt([index], state.selection.anchor.offset),
      },
    ];
  };
}

/** Top-level block retype only. Fail-closed on lists — use `convertBlockType`. */
export function replaceBlockType(type: string, attrs: Record<string, unknown> = {}): Command {
  return (state) => {
    const index = state.selection.anchor.path[0];
    if (index === undefined) {
      return null;
    }
    let block: DocNode;
    try {
      block = core.getNodeAt(state.doc, [index]);
    } catch {
      return null;
    }
    if (isListContainer(block.type)) {
      return null;
    }
    const next = {
      ...core.cloneNode(block),
      attrs: { ...block.attrs, ...attrs },
      type,
    };
    return [
      { index, node: next, path: [], type: 'insert_node' },
      { index: index + 1, path: [], type: 'remove_node' },
    ];
  };
}

/** Ancestor path of `type` along selection, or null. */
export function findAncestorPath(doc: DocNode, selPath: number[], type: string): number[] | null {
  for (let len = selPath.length; len >= 1; len--) {
    const candidate = selPath.slice(0, len);
    try {
      if (core.getNodeAt(doc, candidate).type === type) {
        return candidate;
      }
    } catch {
      /* continue */
    }
  }
  return null;
}

/**
 * Where to insert a block relative to selection.
 * Inside `tableCell` → insert as next sibling of the current cell child;
 * otherwise → after the top-level block.
 */
export function resolveInsertSite(
  doc: DocNode,
  selPath: number[]
): { path: number[]; index: number } {
  const cellPath = findAncestorPath(doc, selPath, 'tableCell');
  if (cellPath) {
    if (selPath.length > cellPath.length) {
      const childIndex = selPath[cellPath.length] ?? 0;
      return { path: cellPath, index: childIndex + 1 };
    }
    return { path: cellPath, index: 0 };
  }
  return { path: [], index: (selPath[0] ?? 0) + 1 };
}

export type InsertBlockNearOptions = {
  /** Insert empty paragraph after the node (default true). */
  trailingParagraph?: boolean;
  /**
   * Build selection after insert.
   * `insertedPath` is parentPath + [index] of the new node.
   */
  select?: (insertedPath: number[]) => Selection;
};

/**
 * Insert a block node after the caret — into the current table cell when selected,
 * otherwise after the top-level block (legacy root insert).
 */
export function insertBlockNearSelection(
  node: DocNode,
  opts: InsertBlockNearOptions = {}
): Command {
  const trailing = opts.trailingParagraph !== false;
  return (state) => {
    const site = resolveInsertSite(state.doc, state.selection.anchor.path);
    const ops: Operation[] = [{ type: 'insert_node', path: site.path, index: site.index, node }];
    if (trailing) {
      ops.push({
        type: 'insert_node',
        path: site.path,
        index: site.index + 1,
        node: core.createParagraph([core.createText('')]),
      });
    }
    const insertedPath = [...site.path, site.index];
    ops.push({
      type: 'set_selection',
      selection: opts.select
        ? opts.select(insertedPath)
        : core.collapsedAt(trailing ? [...site.path, site.index + 1] : insertedPath, 0),
    });
    return ops;
  };
}

export function insertAtomAfter(type: string, attrs: Record<string, unknown> = {}): Command {
  return insertBlockNearSelection(
    { attrs, content: [], id: `${type}_${Date.now()}`, type },
    { trailingParagraph: true }
  );
}

export function wrapInList(listType: 'bulletList' | 'orderedList'): Command {
  return (state) => {
    const index = state.selection.anchor.path[0];
    const block = state.doc.content![index];
    if (block === undefined) {
      return null;
    }
    if (block.type === 'bulletList' || block.type === 'orderedList') {
      if (block.type === listType) {
        const items = block.content ?? [];
        const ops: Operation[] = [{ index, path: [], type: 'remove_node' }];
        items.forEach((li, i) => {
          ops.push({
            index: index + i,
            node: core.createParagraph([...(li.content ?? [core.createText('')])]),
            path: [],
            type: 'insert_node',
          });
        });
        ops.push({
          type: 'set_selection',
          selection: core.collapsedAt([index], 0),
        });
        return ops;
      }
      return [
        {
          index,
          node: { ...core.cloneNode(block), type: listType },
          path: [],
          type: 'insert_node',
        },
        { index: index + 1, path: [], type: 'remove_node' },
        {
          type: 'set_selection',
          selection: core.collapsedAt([index, state.selection.anchor.path[1] ?? 0], 0),
        },
      ];
    }
    const listItem = {
      content:
        block.type === 'paragraph' || block.type === 'heading'
          ? block.content
          : [core.createText('')],
      type: 'listItem',
    };
    const list = {
      content: [listItem],
      id: `list_${Date.now()}`,
      type: listType,
    };
    return [
      { index, node: list, path: [], type: 'insert_node' },
      { index: index + 1, path: [], type: 'remove_node' },
      { type: 'set_selection', selection: core.collapsedAt([index, 0], 0) },
    ];
  };
}
