import type { EditorState } from './transaction';
import { transaction } from './transaction';
import type { Operation } from './operations';
import { offsetHasMark, rangeHasMark, selectionTextRange } from './operations';
import { createParagraph, createText, getNodeAt, textLength } from './document';
import { collapsedAt, orderedRange } from './selection';
import type { DocNode, Mark, Point, Selection } from './types';
import {
  exitListItemOps,
  isListType,
  isTextBlock,
  liftIntoParent,
  plainText,
  resolveTextPath,
} from './structure';

export type Command = (state: EditorState) => Operation[] | null;

function textPath(state: EditorState): number[] {
  return resolveTextPath(state.doc, state.selection.anchor.path);
}

function samePath(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function isLeafTextBlock(node: DocNode): boolean {
  return (
    isTextBlock(node.type) &&
    !(node.content ?? []).some(
      (c) =>
        c.type !== 'text' &&
        (isTextBlock(c.type) ||
          isListType(c.type) ||
          c.type === 'table' ||
          c.type === 'tableRow' ||
          c.type === 'tableCell')
    )
  );
}

/**
 * Ops to delete the current selection — same-path text or cross-block (siblings / root span).
 * Keeps selectAll → deleteBackward/insertText working.
 */
export function deleteSelectionRangeOps(doc: DocNode, sel: Selection): Operation[] | null {
  const { from, to } = orderedRange(sel);
  if (samePath(from.path, to.path)) {
    if (from.offset === to.offset) {
      return null;
    }
    const path = resolveTextPath(doc, from.path);
    return [
      {
        type: 'delete_text',
        path,
        offset: from.offset,
        length: to.offset - from.offset,
      },
    ];
  }

  // True siblings: same parent, same depth
  if (
    from.path.length === to.path.length &&
    from.path.length > 0 &&
    samePath(from.path.slice(0, -1), to.path.slice(0, -1))
  ) {
    return deleteSiblingSpan(doc, from, to);
  }

  return deleteRootSpan(doc, from, to);
}

function deleteSiblingSpan(doc: DocNode, from: Point, to: Point): Operation[] {
  const parent = from.path.slice(0, -1);
  const fromIdx = from.path.at(-1) ?? 0;
  const toIdx = to.path.at(-1) ?? 0;
  return deleteSpanUnderParent(doc, from, to, parent, fromIdx, toIdx);
}

function deleteSpanUnderParent(
  doc: DocNode,
  from: Point,
  to: Point,
  parent: number[],
  fromIdx: number,
  toIdx: number
): Operation[] {
  const fromPath = resolveTextPath(doc, from.path);
  const toPath = resolveTextPath(doc, to.path);
  const ops: Operation[] = [];

  const fromLen = textLength(getNodeAt(doc, fromPath));
  if (from.offset < fromLen) {
    ops.push({
      type: 'delete_text',
      path: fromPath,
      offset: from.offset,
      length: fromLen - from.offset,
    });
  }

  const fromBlock = getNodeAt(doc, [...parent, fromIdx]);
  const toBlock = getNodeAt(doc, [...parent, toIdx]);
  const canMerge = isLeafTextBlock(fromBlock) && isLeafTextBlock(toBlock);

  if (canMerge && toIdx > fromIdx) {
    if (to.offset > 0) {
      const remappedTo = [...toPath];
      if (parent.length < remappedTo.length) {
        remappedTo[parent.length] = toIdx;
      }
      ops.push({ type: 'delete_text', path: remappedTo, offset: 0, length: to.offset });
    }
    for (let i = toIdx - 1; i > fromIdx; i--) {
      ops.push({ type: 'remove_node', path: parent, index: i });
    }
    ops.push({ type: 'merge_paragraph', path: [...parent, fromIdx + 1] });
  } else {
    // Non-leaf containers: leaf-walk so unselected end suffix is kept
    return deleteLeafSpan(doc, from, to);
  }

  ops.push({ type: 'set_selection', selection: collapsedAt(fromPath, from.offset) });
  return ops;
}

function collectTextLeaves(node: DocNode, path: number[], out: number[][]): void {
  if (isLeafTextBlock(node)) {
    out.push([...path]);
    return;
  }
  (node.content ?? []).forEach((child, i) => {
    collectTextLeaves(child, [...path, i], out);
  });
}

function removableAncestor(doc: DocNode, leafPath: number[]): { parent: number[]; index: number } {
  if (leafPath.length >= 2) {
    const itemPath = leafPath.slice(0, -1);
    try {
      const item = getNodeAt(doc, itemPath);
      if (item.type === 'listItem' || item.type === 'tableCell') {
        return { parent: itemPath.slice(0, -1), index: itemPath.at(-1) ?? 0 };
      }
    } catch {
      /* fall through */
    }
  }
  return { parent: leafPath.slice(0, -1), index: leafPath.at(-1) ?? 0 };
}

function deleteLeafSpan(doc: DocNode, from: Point, to: Point): Operation[] {
  const fromPath = resolveTextPath(doc, from.path);
  const toPath = resolveTextPath(doc, to.path);
  let d = 0;
  while (d < fromPath.length && d < toPath.length && fromPath[d] === toPath[d]) {
    d++;
  }
  const rootPath = fromPath.slice(0, d);
  const rootNode = rootPath.length === 0 ? doc : getNodeAt(doc, rootPath);
  const leaves: number[][] = [];
  collectTextLeaves(rootNode, rootPath, leaves);
  const i0 = leaves.findIndex((p) => samePath(p, fromPath));
  const i1 = leaves.findIndex((p) => samePath(p, toPath));
  if (i0 === -1 || i1 === -1) {
    return [];
  }
  const start = Math.min(i0, i1);
  const end = Math.max(i0, i1);
  const ops: Operation[] = [];
  const first = leaves[start];
  if (first === undefined) {
    return [];
  }
  const firstLen = textLength(getNodeAt(doc, first));
  const firstFrom = samePath(first, fromPath) ? from.offset : 0;
  if (firstFrom < firstLen) {
    ops.push({
      type: 'delete_text',
      path: first,
      offset: firstFrom,
      length: firstLen - firstFrom,
    });
  }

  // Collect removable containers for fully covered start + middle + end (high → low)
  const removals: { parent: number[]; index: number; key: string }[] = [];
  const startFullyCovered = firstFrom === 0 && (end > start || to.offset >= firstLen);
  for (let i = end; i >= start; i--) {
    if (i === start && !startFullyCovered) {
      continue;
    }
    const leaf = leaves[i];
    if (leaf === undefined) {
      continue;
    }
    const fullyCovered =
      i === start ? startFullyCovered : i < end || to.offset >= textLength(getNodeAt(doc, leaf));
    if (!fullyCovered) {
      if (i === end && to.offset > 0) {
        ops.push({ type: 'delete_text', path: leaf, offset: 0, length: to.offset });
      }
      continue;
    }
    const rem = removableAncestor(doc, leaf);
    const key = `${rem.parent.join('.')}:${rem.index}`;
    if (!removals.some((r) => r.key === key)) {
      removals.push({ ...rem, key });
    }
  }
  removals.sort((a, b) => {
    if (a.parent.length !== b.parent.length) {
      return b.parent.length - a.parent.length;
    }
    for (let i = 0; i < a.parent.length; i++) {
      if (a.parent[i] !== b.parent[i]) {
        return (b.parent[i] ?? 0) - (a.parent[i] ?? 0);
      }
    }
    return b.index - a.index;
  });
  for (const rem of removals) {
    ops.push({ type: 'remove_node', path: rem.parent, index: rem.index });
  }

  ops.push({ type: 'set_selection', selection: collapsedAt(fromPath, from.offset) });
  return ops;
}

function deleteRootSpan(doc: DocNode, from: Point, to: Point): Operation[] {
  const fromRoot = from.path[0] ?? 0;
  const toRoot = to.path[0] ?? 0;
  const fromPath = resolveTextPath(doc, from.path);
  const ops: Operation[] = [];

  if (fromRoot === toRoot) {
    let d = 0;
    while (d < from.path.length && d < to.path.length && from.path[d] === to.path[d]) {
      d++;
    }
    if (d < from.path.length && d < to.path.length && from.path.length === to.path.length) {
      return deleteSpanUnderParent(
        doc,
        from,
        to,
        from.path.slice(0, d),
        from.path[d] ?? 0,
        to.path[d] ?? 0
      );
    }
    return deleteLeafSpan(doc, from, to);
  }

  const fromLen = textLength(getNodeAt(doc, fromPath));
  if (from.offset < fromLen) {
    ops.push({
      type: 'delete_text',
      path: fromPath,
      offset: from.offset,
      length: fromLen - from.offset,
    });
  }

  const fromBlock = getNodeAt(doc, [fromRoot]);
  const toBlock = getNodeAt(doc, [toRoot]);
  const toPath = resolveTextPath(doc, to.path);
  const simple =
    from.path.length === 1 &&
    to.path.length === 1 &&
    isLeafTextBlock(fromBlock) &&
    isLeafTextBlock(toBlock);

  if (simple) {
    if (to.offset > 0) {
      ops.push({ type: 'delete_text', path: toPath, offset: 0, length: to.offset });
    }
    for (let i = toRoot - 1; i > fromRoot; i--) {
      ops.push({ type: 'remove_node', path: [], index: i });
    }
    ops.push({ type: 'merge_paragraph', path: [fromRoot + 1] });
  } else {
    // Mixed / nested roots: leaf-walk to preserve unselected end suffix
    return deleteLeafSpan(doc, from, to);
  }

  ops.push({ type: 'set_selection', selection: collapsedAt(fromPath, from.offset) });
  return ops;
}

export function insertText(text: string, marks?: Mark[]): Command {
  return (state) => {
    const range = selectionTextRange(state.selection);
    if (!range) {
      const cross = deleteSelectionRangeOps(state.doc, state.selection);
      if (cross && !isCollapsedSelection(state.selection)) {
        const path = resolveTextPath(state.doc, orderedRange(state.selection).from.path);
        const offset = orderedRange(state.selection).from.offset;
        const ops: Operation[] = cross.filter((op) => op.type !== 'set_selection');
        ops.push(
          marks && marks.length > 0
            ? { type: 'insert_text', path, offset, text, marks }
            : { type: 'insert_text', path, offset, text },
          { type: 'set_selection', selection: collapsedAt(path, offset + text.length) }
        );
        return ops;
      }
    }
    const path = resolveTextPath(state.doc, range?.path ?? state.selection.anchor.path);
    const offset = range ? range.from : state.selection.anchor.offset;
    const ops: Operation[] = [];
    if (range && range.from !== range.to) {
      ops.push({
        type: 'delete_text',
        path,
        offset: range.from,
        length: range.to - range.from,
      });
    }
    ops.push(
      marks && marks.length > 0
        ? { type: 'insert_text', path, offset, text, marks }
        : { type: 'insert_text', path, offset, text }
    );
    return ops;
  };
}

function isCollapsedSelection(sel: Selection): boolean {
  return samePath(sel.anchor.path, sel.focus.path) && sel.anchor.offset === sel.focus.offset;
}

/**
 * Track-changes style backspace: mark the previous char as deleted instead of
 * removing it. Hard-deletes own `insertion` marks and already-marked deletions.
 */
export function softDeleteBackward(deletionMark: Mark): Command {
  return (state) => {
    if (!isCollapsedSelection(state.selection)) {
      return deleteBackward(state);
    }
    const path = textPath(state);
    const offset = state.selection.anchor.offset;
    if (offset <= 0) {
      return deleteBackward(state);
    }

    const para = getNodeAt(state.doc, path);
    const { text, runs } = flattenTextForMarks(para);
    if (text.length === 0) {
      return deleteBackward(state);
    }
    const from = offset - 1;
    const existing = marksAtOffset(runs, from);
    if (existing.some((m) => m.type === 'insertion' || m.type === deletionMark.type)) {
      return [{ type: 'delete_text', path, offset: from, length: 1 }];
    }
    return [
      { type: 'set_mark', path, from, to: offset, mark: deletionMark },
      { type: 'set_selection', selection: collapsedAt(path, from) },
    ];
  };
}

function flattenTextForMarks(paragraph: DocNode): {
  text: string;
  runs: { start: number; end: number; marks: Mark[] }[];
} {
  let text = '';
  const runs: { start: number; end: number; marks: Mark[] }[] = [];
  for (const child of paragraph.content ?? []) {
    if (child.type !== 'text') {
      continue;
    }
    const start = text.length;
    const chunk = child.text ?? '';
    text += chunk;
    runs.push({
      start,
      end: text.length,
      marks: (child.marks ?? []).map((m) => ({ ...m })),
    });
  }
  return { text, runs };
}

function marksAtOffset(
  runs: { start: number; end: number; marks: Mark[] }[],
  index: number
): Mark[] {
  for (const run of runs) {
    if (index >= run.start && index < run.end) {
      return run.marks.map((m) => ({ ...m }));
    }
  }
  return [];
}

/** Resolve list-item path when caret is on the item or its first nested text block. */
function listItemContext(
  doc: DocNode,
  path: number[]
): { listItemPath: number[]; listPath: number[]; itemIndex: number } | null {
  let node: DocNode;
  try {
    node = getNodeAt(doc, path);
  } catch {
    return null;
  }
  if (node.type === 'listItem') {
    const itemIndex = path.at(-1) ?? 0;
    return { listItemPath: path, listPath: path.slice(0, -1), itemIndex };
  }
  if (path.length < 2) {
    return null;
  }
  const parentPath = path.slice(0, -1);
  try {
    const parent = getNodeAt(doc, parentPath);
    if (parent.type === 'listItem' && (path.at(-1) ?? 0) === 0) {
      const itemIndex = parentPath.at(-1) ?? 0;
      return { listItemPath: parentPath, listPath: parentPath.slice(0, -1), itemIndex };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export const deleteBackward: Command = (state) => {
  const crossOrSame = deleteSelectionRangeOps(state.doc, state.selection);
  if (crossOrSame) {
    const range = selectionTextRange(state.selection);
    if (!range || range.from !== range.to) {
      return crossOrSame;
    }
  }

  const path = textPath(state);
  const offset = state.selection.anchor.offset;

  if (offset > 0) {
    return [{ type: 'delete_text', path, offset: offset - 1, length: 1 }];
  }

  const listCtx = listItemContext(state.doc, path);
  if (listCtx) {
    const { listItemPath, listPath, itemIndex } = listCtx;
    if (itemIndex > 0) {
      const prevItemPath = [...listPath, itemIndex - 1];
      const leftItem = getNodeAt(state.doc, prevItemPath);
      const rightItem = getNodeAt(state.doc, listItemPath);
      if (isLeafTextBlock(leftItem) && isLeafTextBlock(rightItem)) {
        return [{ type: 'merge_paragraph', path: listItemPath }];
      }
      // Nested listItem → block children: move right children into left, drop right, merge boundary leaves
      const ops: Operation[] = [];
      const leftCount = leftItem.content?.length ?? 0;
      const rightContent = rightItem.content ?? [];
      for (let i = 0; i < rightContent.length; i++) {
        const node = rightContent[i];
        if (node === undefined) {
          continue;
        }
        ops.push({
          type: 'insert_node',
          path: prevItemPath,
          index: leftCount + i,
          node,
        });
      }
      ops.push({ type: 'remove_node', path: listPath, index: itemIndex });
      const leftLast = leftCount > 0 ? leftItem.content?.[leftCount - 1] : undefined;
      const rightFirst = rightContent[0];
      if (
        leftLast !== undefined &&
        rightFirst !== undefined &&
        isLeafTextBlock(leftLast) &&
        isLeafTextBlock(rightFirst)
      ) {
        const joinAt = textLength(leftLast);
        ops.push(
          { type: 'merge_paragraph', path: [...prevItemPath, leftCount] },
          {
            type: 'set_selection',
            selection: collapsedAt([...prevItemPath, leftCount - 1], joinAt),
          }
        );
      } else {
        const selPath = resolveTextPath(state.doc, prevItemPath);
        ops.push({
          type: 'set_selection',
          selection: collapsedAt(selPath, textLength(getNodeAt(state.doc, selPath))),
        });
      }
      return ops;
    }
    // First list item at offset 0: lift into parent, optionally merge with prev sibling
    const parentPath = listPath.slice(0, -1);
    const { ops, selectionPath, liftedIndex } = liftIntoParent(state.doc, listPath, itemIndex);
    if (liftedIndex > 0) {
      try {
        const prev = getNodeAt(state.doc, [...parentPath, liftedIndex - 1]);
        if (isTextBlock(prev.type)) {
          const joinAt = textLength(prev);
          return [
            ...ops,
            { type: 'merge_paragraph', path: [...parentPath, liftedIndex] },
            {
              type: 'set_selection',
              selection: collapsedAt([...parentPath, liftedIndex - 1], joinAt),
            },
          ];
        }
      } catch {
        /* ignore */
      }
    }
    return [...ops, { type: 'set_selection', selection: collapsedAt(selectionPath, 0) }];
  }

  // Don't destroy table by merging out of first cell para
  if (path.length >= 4) {
    const cellPath = path.slice(0, 3);
    try {
      if (getNodeAt(state.doc, cellPath).type === 'tableCell' && (path.at(-1) ?? 0) === 0) {
        return null;
      }
    } catch {
      /* ignore */
    }
  }

  if (path.length === 1) {
    if (path[0] <= 0) {
      return null;
    }
    return [{ type: 'merge_paragraph', path }];
  }

  const index = path.at(-1);
  if (index === undefined || index <= 0) {
    return null;
  }
  return [{ type: 'merge_paragraph', path }];
};

/** Delete one character forward of the caret (range → delete selection, incl. cross-block). */
export const deleteForward: Command = (state) => {
  const crossOrSame = deleteSelectionRangeOps(state.doc, state.selection);
  if (crossOrSame) {
    const range = selectionTextRange(state.selection);
    if (!range || range.from !== range.to) {
      return crossOrSame;
    }
  }
  const path = textPath(state);
  const offset = state.selection.anchor.offset;
  let node: DocNode;
  try {
    node = getNodeAt(state.doc, path);
  } catch {
    return null;
  }
  if (offset < textLength(node)) {
    return [{ type: 'delete_text', path, offset, length: 1 }];
  }
  return null;
};

export const splitBlock: Command = (state) => {
  const path = textPath(state);
  const offset = state.selection.anchor.offset;
  let node;
  try {
    node = getNodeAt(state.doc, path);
  } catch {
    return null;
  }

  if (
    isListType(node.type) ||
    node.type === 'table' ||
    node.type === 'tableRow' ||
    node.type === 'tableCell'
  ) {
    return null;
  }

  const parentPath = path.slice(0, -1);
  let parentIsList = false;
  if (path.length >= 2) {
    try {
      parentIsList = isListType(getNodeAt(state.doc, parentPath).type);
    } catch {
      parentIsList = false;
    }
  }

  // listItem, or text block nested under a list (e.g. after a bad split)
  const inList = node.type === 'listItem' || (parentIsList && isTextBlock(node.type));
  if (inList) {
    if (plainText(node).length === 0) {
      const listPath = parentIsList ? parentPath : path.slice(0, -1);
      const itemIndex = path.at(-1) ?? 0;
      const { ops, selectionPath } = exitListItemOps(state.doc, listPath, itemIndex);
      return [...ops, { type: 'set_selection', selection: collapsedAt(selectionPath, 0) }];
    }
    return [{ type: 'split_paragraph', path, offset }];
  }

  if (node.type === 'heading' && offset >= plainText(node).length) {
    const headingParentPath = path.slice(0, -1);
    const index = (path.at(-1) ?? 0) + 1;
    return [
      {
        type: 'insert_node',
        path: headingParentPath,
        index,
        node: createParagraph([createText('')]),
      },
      { type: 'set_selection', selection: collapsedAt([...headingParentPath, index], 0) },
    ];
  }

  if (isTextBlock(node.type)) {
    return [{ type: 'split_paragraph', path, offset }];
  }

  return null;
};

export function toggleMark(markType: string): Command {
  return (state) => {
    const range = selectionTextRange(state.selection);
    if (!range || range.from === range.to) {
      return null;
    }
    const para = getNodeAt(state.doc, range.path);
    const fullyMarked = rangeHasMark(para, range.from, range.to, markType);
    if (fullyMarked) {
      return [
        {
          type: 'remove_mark',
          path: range.path,
          from: range.from,
          to: range.to,
          markType,
        },
      ];
    }
    return [
      {
        type: 'set_mark',
        path: range.path,
        from: range.from,
        to: range.to,
        mark: { type: markType },
      },
    ];
  };
}

/** Whether the current selection (or caret) carries `markType`. */
export function selectionHasMark(markType: string): (state: EditorState) => boolean {
  return (state) => {
    const range = selectionTextRange(state.selection);
    if (!range) {
      return false;
    }
    const para = getNodeAt(state.doc, range.path);
    if (range.from === range.to) {
      const probe = range.from > 0 ? range.from - 1 : range.from;
      return offsetHasMark(para, probe, markType);
    }
    return rangeHasMark(para, range.from, range.to, markType);
  };
}

export const selectAll: Command = (state) => {
  const leaves: number[][] = [];
  collectTextLeaves(state.doc, [], leaves);
  if (leaves.length === 0) {
    return null;
  }
  const first = leaves[0];
  const last = leaves.at(-1);
  if (first === undefined || last === undefined) {
    return null;
  }
  const len = plainText(getNodeAt(state.doc, last)).length;
  return [
    {
      type: 'set_selection',
      selection: {
        anchor: { path: first, offset: 0 },
        focus: { path: last, offset: len },
      },
    },
  ];
};

export function runCommand(state: EditorState, command: Command) {
  const ops = command(state);
  if (!ops) {
    return null;
  }
  return transaction(...ops);
}
