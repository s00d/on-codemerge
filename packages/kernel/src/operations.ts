import type { DocNode, Mark, Selection } from './types';
import {
  cloneNode,
  copyAttrs,
  createText,
  deepCloneNode,
  getNodeAt,
  nextId,
  replaceAt,
  textLength,
} from './document';
import { clampSelection, collapsedAt, orderedRange } from './selection';
import type { Schema } from './schema';
import { assertMark, assertNodeType } from './schema';

export { textLength };

export type TextRun = { text: string; marks: Mark[] };

/** Inline keep (hardBreak etc.) relative to a slice start. */
export type SliceKeep = { at: number; node: DocNode };

export type Operation =
  | {
      type: 'insert_text';
      path: number[];
      offset: number;
      text: string;
      marks?: Mark[];
      marksByOffset?: Mark[][];
    }
  | { type: 'delete_text'; path: number[]; offset: number; length: number }
  | {
      type: 'split_paragraph';
      path: number[];
      offset: number;
      /** When set (merge inverse), restore this node as the right block. */
      rightNode?: DocNode;
    }
  | { type: 'merge_paragraph'; path: number[] }
  | { type: 'set_selection'; selection: Selection }
  | { type: 'set_mark'; path: number[]; from: number; to: number; mark: Mark }
  | { type: 'remove_mark'; path: number[]; from: number; to: number; markType: string }
  | {
      type: 'replace_slice';
      path: number[];
      from: number;
      to: number;
      runs: TextRun[];
      keeps?: SliceKeep[];
    }
  | { type: 'insert_node'; path: number[]; index: number; node: DocNode }
  | { type: 'remove_node'; path: number[]; index: number }
  | {
      type: 'set_attrs';
      path: number[];
      attrs: Record<string, unknown>;
      replace?: boolean;
    };

export type InvertibleOp = { op: Operation; inverse: Operation };

type FlatKeep = { at: number; node: DocNode };
type FlatRun = { start: number; end: number; node: DocNode };

const BLOCK_CHILD_TYPES = new Set([
  'paragraph',
  'heading',
  'listItem',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'table',
  'tableRow',
  'tableCell',
]);

function assertIntegerPath(path: number[]): void {
  for (const seg of path) {
    if (!Number.isInteger(seg)) {
      throw new TypeError(`Path segments must be integers: ${path.join('.')}`);
    }
  }
}

function assertLeafTextBlock(node: DocNode): void {
  if (node.type === 'text') {
    throw new Error('Text ops require a leaf text block');
  }
  if ((node.content ?? []).some((c) => BLOCK_CHILD_TYPES.has(c.type))) {
    throw new Error('Text ops require a leaf text block');
  }
}

function flattenText(paragraph: DocNode): {
  text: string;
  runs: FlatRun[];
  keeps: FlatKeep[];
} {
  const runs: FlatRun[] = [];
  const keeps: FlatKeep[] = [];
  let text = '';
  for (const child of paragraph.content ?? []) {
    if (child.type === 'text') {
      const start = text.length;
      const chunk = child.text ?? '';
      text += chunk;
      runs.push({ start, end: text.length, node: child });
    } else {
      keeps.push({ at: text.length, node: deepCloneNode(child) });
    }
  }
  return { text, runs, keeps };
}

function rebuildParagraph(
  paragraph: DocNode,
  text: string,
  markAt: (i: number) => Mark[],
  keeps: FlatKeep[] = []
): DocNode {
  const keepsSorted = [...keeps].toSorted((a, b) => a.at - b.at);
  if (text.length === 0) {
    if (keepsSorted.length === 0) {
      return { ...cloneNode(paragraph), content: [createText('')] };
    }
    return {
      ...cloneNode(paragraph),
      content: keepsSorted.map((k) => deepCloneNode(k.node)),
    };
  }

  const content: DocNode[] = [];
  let keepIdx = 0;
  let i = 0;

  while (keepIdx < keepsSorted.length && keepsSorted[keepIdx].at <= 0) {
    content.push(deepCloneNode(keepsSorted[keepIdx].node));
    keepIdx++;
  }

  while (i < text.length) {
    const marks = markAt(i);
    let j = i + 1;
    const nextKeepAt = keepsSorted[keepIdx]?.at ?? text.length + 1;
    while (j < text.length && j < nextKeepAt && sameMarks(markAt(j), marks)) {
      j++;
    }
    const end = Math.min(j, nextKeepAt, text.length);
    if (end > i) {
      content.push(createText(text.slice(i, end), marks));
      i = end;
    }
    while (keepIdx < keepsSorted.length && keepsSorted[keepIdx].at === i) {
      content.push(deepCloneNode(keepsSorted[keepIdx].node));
      keepIdx++;
    }
  }

  while (keepIdx < keepsSorted.length && keepsSorted[keepIdx].at >= text.length) {
    content.push(deepCloneNode(keepsSorted[keepIdx].node));
    keepIdx++;
  }

  if (content.length === 0) {
    content.push(createText(''));
  }
  return { ...cloneNode(paragraph), content };
}

function shiftKeeps(keeps: FlatKeep[], offset: number, delta: number): FlatKeep[] {
  return keeps.map((k) => (k.at >= offset ? { ...k, at: k.at + delta } : k));
}

function deleteKeepsInRange(keeps: FlatKeep[], offset: number, length: number): FlatKeep[] {
  const end = offset + length;
  return keeps
    .filter((k) => k.at <= offset || k.at >= end)
    .map((k) => (k.at >= end ? { ...k, at: k.at - length } : k));
}

function captureKeepsInRange(keeps: FlatKeep[], from: number, to: number): SliceKeep[] {
  return keeps
    .filter((k) => k.at > from && k.at < to)
    .map((k) => ({ at: k.at - from, node: deepCloneNode(k.node) }));
}

function mergeSliceKeeps(
  base: FlatKeep[],
  from: number,
  sliceKeeps: SliceKeep[] | undefined
): FlatKeep[] {
  if (sliceKeeps === undefined || sliceKeeps.length === 0) {
    return base;
  }
  return [...base, ...sliceKeeps.map((k) => ({ at: from + k.at, node: deepCloneNode(k.node) }))];
}

function assertOpSchema(schema: Schema | undefined, op: Operation): void {
  if (!schema) {
    return;
  }
  if (op.type === 'set_mark') {
    assertMark(schema, op.mark);
  } else if (op.type === 'insert_text') {
    if (op.marks) {
      for (const m of op.marks) {
        assertMark(schema, m);
      }
    }
    if (op.marksByOffset) {
      for (const ms of op.marksByOffset) {
        for (const m of ms) {
          assertMark(schema, m);
        }
      }
    }
  } else if (op.type === 'replace_slice') {
    for (const run of op.runs) {
      for (const m of run.marks) {
        assertMark(schema, m);
      }
    }
    for (const k of op.keeps ?? []) {
      assertMaxTreeDepth(k.node);
      assertNodeTree(schema, k.node);
    }
  } else if (op.type === 'split_paragraph') {
    if (op.rightNode) {
      assertMaxTreeDepth(op.rightNode);
      assertNodeTree(schema, op.rightNode);
    }
  } else if (op.type === 'insert_node') {
    assertNodeTree(schema, op.node);
  }
}

function assertNodeTree(schema: Schema, node: DocNode, depthChecked = false): void {
  if (!depthChecked) {
    assertMaxTreeDepth(node);
  }
  assertNodeType(schema, node.type);
  if (node.marks) {
    for (const m of node.marks) {
      assertMark(schema, m);
    }
  }
  for (const child of node.content ?? []) {
    assertNodeTree(schema, child, true);
  }
}

function sameMarks(a: Mark[], b: Mark[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every(
    (m, i) =>
      m.type === b[i].type && JSON.stringify(m.attrs ?? {}) === JSON.stringify(b[i].attrs ?? {})
  );
}

function cloneMarks(marks: Mark[]): Mark[] {
  return marks.map((m) => ({ ...m, attrs: m.attrs ? { ...m.attrs } : undefined }));
}

function marksAt(runs: FlatRun[], index: number): Mark[] {
  for (const run of runs) {
    if (index >= run.start && index < run.end) {
      return run.node.marks ? cloneMarks(run.node.marks) : [];
    }
  }
  // caret at end — inherit last run marks
  const lastRun = runs.at(-1);
  if (lastRun && index === lastRun.end) {
    return lastRun.node.marks ? cloneMarks(lastRun.node.marks) : [];
  }
  return [];
}

function captureRuns(text: string, runs: FlatRun[], from: number, to: number): TextRun[] {
  const result: TextRun[] = [];
  let i = from;
  while (i < to) {
    const marks = marksAt(runs, i);
    let j = i + 1;
    while (j < to && sameMarks(marksAt(runs, j), marks)) {
      j++;
    }
    result.push({ text: text.slice(i, j), marks });
    i = j;
  }
  return result;
}

/** True when every offset in `[from, to)` carries `markType`. Empty range → false. */
export function rangeHasMark(
  paragraph: DocNode,
  from: number,
  to: number,
  markType: string
): boolean {
  const { text, runs } = flattenText(paragraph);
  const start = Math.max(0, Math.min(from, text.length));
  const end = Math.max(start, Math.min(to, text.length));
  if (start >= end) {
    return false;
  }
  for (let i = start; i < end; i++) {
    if (!marksAt(runs, i).some((m) => m.type === markType)) {
      return false;
    }
  }
  return true;
}

/** Mark presence at a single offset (caret / left of caret). */
export function offsetHasMark(paragraph: DocNode, offset: number, markType: string): boolean {
  const { text, runs } = flattenText(paragraph);
  if (text.length === 0) {
    return false;
  }
  const i = Math.max(0, Math.min(offset, text.length - 1));
  return marksAt(runs, i).some((m) => m.type === markType);
}

/** Merge marks by type — `extra` wins on conflict. */
export function mergeMarksByType(base: Mark[], extra: Mark[]): Mark[] {
  const map = new Map<string, Mark>();
  for (const m of base) {
    map.set(m.type, { ...m, attrs: m.attrs ? { ...m.attrs } : undefined });
  }
  for (const m of extra) {
    map.set(m.type, { ...m, attrs: m.attrs ? { ...m.attrs } : undefined });
  }
  return [...map.values()];
}

/** Hard cap on a single insert_text / replace_slice payload (paste / programmatic flood). */
export const MAX_INSERT_CHARS = 100_000;
/** Cap on keep nodes injected via replace_slice (hardBreak floods). */
export const MAX_SLICE_KEEPS = 10_000;
/** Max nesting depth for op/JSON trees (empty structural bombs). */
export const MAX_TREE_DEPTH = 64;

/** Iterative depth check — fail closed before recursive clone/walk. */
export function assertMaxTreeDepth(node: DocNode, max = MAX_TREE_DEPTH): void {
  const stack: { n: DocNode; d: number }[] = [{ n: node, d: 0 }];
  while (stack.length > 0) {
    const { n, d } = stack.pop()!;
    if (d > max) {
      throw new Error(`Tree exceeds MAX_TREE_DEPTH (${max})`);
    }
    for (const child of n.content ?? []) {
      stack.push({ n: child, d: d + 1 });
    }
  }
}

export function applyOp(
  doc: DocNode,
  op: Operation,
  schema?: Schema
): { doc: DocNode; inverse: Operation } {
  if ('path' in op) {
    assertIntegerPath(op.path);
  }
  assertOpSchema(schema, op);

  switch (op.type) {
    case 'insert_text': {
      if (op.text.length > MAX_INSERT_CHARS) {
        throw new Error(`insert_text exceeds MAX_INSERT_CHARS (${MAX_INSERT_CHARS})`);
      }
      const para = getNodeAt(doc, op.path);
      assertLeafTextBlock(para);
      const { text, runs, keeps } = flattenText(para);
      const offset = Math.max(0, Math.min(op.offset, text.length));
      const nextText = text.slice(0, offset) + op.text + text.slice(offset);
      const nextKeeps = shiftKeeps(keeps, offset, op.text.length);
      const nextPara = rebuildParagraph(
        para,
        nextText,
        (i) => {
          if (i >= offset && i < offset + op.text.length) {
            if (op.marksByOffset) {
              return cloneMarks(op.marksByOffset[i - offset] ?? []);
            }
            const inherited = marksAt(runs, Math.max(0, offset - 1));
            return op.marks && op.marks.length > 0
              ? mergeMarksByType(inherited, op.marks)
              : inherited;
          }
          const src = i < offset ? i : i - op.text.length;
          return marksAt(runs, src);
        },
        nextKeeps
      );
      return {
        doc: replaceAt(doc, op.path, nextPara),
        inverse: { type: 'delete_text', path: op.path, offset, length: op.text.length },
      };
    }
    case 'delete_text': {
      const para = getNodeAt(doc, op.path);
      assertLeafTextBlock(para);
      const { text, runs, keeps } = flattenText(para);
      const offset = Math.max(0, Math.min(op.offset, text.length));
      const length = Math.min(op.length, text.length - offset);
      const deletedKeeps = captureKeepsInRange(keeps, offset, offset + length);
      const captured = captureRuns(text, runs, offset, offset + length);
      const nextText = text.slice(0, offset) + text.slice(offset + length);
      const nextKeeps = deleteKeepsInRange(keeps, offset, length);
      const nextPara = rebuildParagraph(
        para,
        nextText,
        (i) => {
          const src = i < offset ? i : i + length;
          return marksAt(runs, src);
        },
        nextKeeps
      );
      return {
        doc: replaceAt(doc, op.path, nextPara),
        inverse: {
          type: 'replace_slice',
          path: op.path,
          from: offset,
          to: offset,
          runs: captured,
          keeps: deletedKeeps,
        },
      };
    }
    case 'split_paragraph': {
      const parentPath = op.path.slice(0, -1);
      const index = op.path.at(-1);
      if (index === undefined) {
        throw new Error('split_paragraph path is empty');
      }
      assertIntegerPath(parentPath);
      const parent = parentPath.length > 0 ? getNodeAt(doc, parentPath) : doc;
      const para = getNodeAt(doc, op.path);
      assertLeafTextBlock(para);
      const { text, runs, keeps } = flattenText(para);
      const offset = Math.max(0, Math.min(op.offset, text.length));
      const leftKeeps = keeps.filter((k) => k.at < offset);
      const left = rebuildParagraph(
        para,
        text.slice(0, offset),
        (i) => marksAt(runs, i),
        leftKeeps
      );
      let rightRebuilt: DocNode;
      if (op.rightNode) {
        rightRebuilt = deepCloneNode(op.rightNode);
      } else {
        const rightKeeps = keeps
          .filter((k) => k.at >= offset)
          .map((k) => ({ ...k, at: k.at - offset }));
        const rightSeed = {
          ...cloneNode(para),
          content: [createText('')],
          id: nextId(para.type === 'listItem' ? 'li' : 'p'),
        };
        rightRebuilt = rebuildParagraph(
          rightSeed,
          text.slice(offset),
          (i) => marksAt(runs, offset + i),
          rightKeeps
        );
      }
      const nextParent = cloneNode(parent);
      if (!nextParent.content) {
        throw new Error('split parent has no content');
      }
      nextParent.content.splice(index, 1, left, rightRebuilt);
      const nextDoc = parentPath.length > 0 ? replaceAt(doc, parentPath, nextParent) : nextParent;
      return {
        doc: nextDoc,
        inverse: { type: 'merge_paragraph', path: [...parentPath, index + 1] },
      };
    }
    case 'merge_paragraph': {
      const parentPath = op.path.slice(0, -1);
      const index = op.path.at(-1);
      if (index === undefined || index <= 0) {
        throw new Error('Cannot merge first paragraph');
      }
      assertIntegerPath(parentPath);
      const parent = parentPath.length > 0 ? getNodeAt(doc, parentPath) : doc;
      const left = getNodeAt(doc, [...parentPath, index - 1]);
      const right = getNodeAt(doc, op.path);
      assertLeafTextBlock(left);
      assertLeafTextBlock(right);
      const rightSnap = deepCloneNode(right);
      const leftFlat = flattenText(left);
      const rightFlat = flattenText(right);
      const mergedText = leftFlat.text + rightFlat.text;
      const joinAt = leftFlat.text.length;
      const mergedKeeps = [
        ...leftFlat.keeps,
        ...rightFlat.keeps.map((k) => ({ ...k, at: k.at + joinAt })),
      ];
      const merged = rebuildParagraph(
        left,
        mergedText,
        (i) => {
          if (i < joinAt) {
            return marksAt(leftFlat.runs, i);
          }
          return marksAt(rightFlat.runs, i - joinAt);
        },
        mergedKeeps
      );
      const nextParent = cloneNode(parent);
      if (!nextParent.content) {
        throw new Error('merge parent has no content');
      }
      nextParent.content.splice(index - 1, 2, merged);
      const nextDoc = parentPath.length > 0 ? replaceAt(doc, parentPath, nextParent) : nextParent;
      return {
        doc: nextDoc,
        inverse: {
          type: 'split_paragraph',
          path: [...parentPath, index - 1],
          offset: joinAt,
          rightNode: rightSnap,
        },
      };
    }
    case 'set_selection': {
      return { doc, inverse: op };
    }
    case 'set_attrs': {
      const node = getNodeAt(doc, op.path);
      const prevSnapshot =
        copyAttrs(node.attrs) ?? (Object.create(null) as Record<string, unknown>);
      let nextAttrs: Record<string, unknown>;
      if (op.replace) {
        nextAttrs = copyAttrs(op.attrs) ?? (Object.create(null) as Record<string, unknown>);
      } else {
        nextAttrs = copyAttrs(node.attrs) ?? (Object.create(null) as Record<string, unknown>);
        for (const [key, value] of Object.entries(op.attrs)) {
          if (value === null) {
            delete nextAttrs[key];
          } else {
            nextAttrs[key] = value;
          }
        }
      }
      const next = {
        ...cloneNode(node),
        attrs: Object.keys(nextAttrs).length > 0 ? nextAttrs : undefined,
      };
      return {
        doc: replaceAt(doc, op.path, next),
        inverse: { type: 'set_attrs', path: op.path, attrs: prevSnapshot, replace: true },
      };
    }
    case 'set_mark': {
      const para = getNodeAt(doc, op.path);
      assertLeafTextBlock(para);
      const { text, runs, keeps } = flattenText(para);
      const from = Math.max(0, Math.min(op.from, text.length));
      const to = Math.max(from, Math.min(op.to, text.length));
      const captured = captureRuns(text, runs, from, to);
      const lostKeeps = captureKeepsInRange(keeps, from, to);
      const nextPara = rebuildParagraph(
        para,
        text,
        (i) => {
          const base = marksAt(runs, i);
          if (i >= from && i < to) {
            const filtered = base.filter((m) => m.type !== op.mark.type);
            return [...filtered, { ...op.mark, attrs: copyAttrs(op.mark.attrs) }];
          }
          return base;
        },
        keeps
      );
      return {
        doc: replaceAt(doc, op.path, nextPara),
        inverse: {
          type: 'replace_slice',
          path: op.path,
          from,
          to,
          runs: captured,
          keeps: lostKeeps,
        },
      };
    }
    case 'remove_mark': {
      const para = getNodeAt(doc, op.path);
      assertLeafTextBlock(para);
      const { text, runs, keeps } = flattenText(para);
      const from = Math.max(0, Math.min(op.from, text.length));
      const to = Math.max(from, Math.min(op.to, text.length));
      const captured = captureRuns(text, runs, from, to);
      const lostKeeps = captureKeepsInRange(keeps, from, to);
      const nextPara = rebuildParagraph(
        para,
        text,
        (i) => {
          const base = marksAt(runs, i);
          if (i >= from && i < to) {
            return base.filter((m) => m.type !== op.markType);
          }
          return base;
        },
        keeps
      );
      return {
        doc: replaceAt(doc, op.path, nextPara),
        inverse: {
          type: 'replace_slice',
          path: op.path,
          from,
          to,
          runs: captured,
          keeps: lostKeeps,
        },
      };
    }
    case 'replace_slice': {
      const para = getNodeAt(doc, op.path);
      assertLeafTextBlock(para);
      const { text, runs, keeps } = flattenText(para);
      const from = Math.max(0, Math.min(op.from, text.length));
      const to = Math.max(from, Math.min(op.to, text.length));
      const captured = captureRuns(text, runs, from, to);
      const lostKeeps = captureKeepsInRange(keeps, from, to);
      const newText = op.runs.map((r) => r.text).join('');
      if (newText.length > MAX_INSERT_CHARS) {
        throw new Error(`replace_slice exceeds MAX_INSERT_CHARS (${MAX_INSERT_CHARS})`);
      }
      if ((op.keeps?.length ?? 0) > MAX_SLICE_KEEPS) {
        throw new Error(`replace_slice exceeds MAX_SLICE_KEEPS (${MAX_SLICE_KEEPS})`);
      }
      const insertedMarks: Mark[][] = [];
      for (const run of op.runs) {
        const marks = cloneMarks(run.marks);
        for (let i = 0; i < run.text.length; i++) {
          insertedMarks.push(cloneMarks(marks));
        }
      }
      const nextText = text.slice(0, from) + newText + text.slice(to);
      const delta = newText.length - (to - from);
      const shifted = keeps
        .filter((k) => k.at <= from || k.at >= to)
        .map((k) => (k.at >= to ? { ...k, at: k.at + delta } : k));
      const nextKeeps = mergeSliceKeeps(shifted, from, op.keeps);
      const nextPara = rebuildParagraph(
        para,
        nextText,
        (i) => {
          if (i >= from && i < from + newText.length) {
            return insertedMarks[i - from] ?? [];
          }
          const src = i < from ? i : i - delta;
          return marksAt(runs, src);
        },
        nextKeeps
      );
      return {
        doc: replaceAt(doc, op.path, nextPara),
        inverse: {
          type: 'replace_slice',
          path: op.path,
          from,
          to: from + newText.length,
          runs: captured,
          keeps: lostKeeps,
        },
      };
    }
    case 'insert_node': {
      assertMaxTreeDepth(op.node);
      if (textLength(op.node) > MAX_INSERT_CHARS) {
        throw new Error(`insert_node exceeds MAX_INSERT_CHARS (${MAX_INSERT_CHARS})`);
      }
      const parent = op.path.length > 0 ? getNodeAt(doc, op.path) : doc;
      const nextParent = cloneNode(parent);
      nextParent.content ??= [];
      const index = Math.max(0, Math.min(op.index, nextParent.content.length));
      nextParent.content.splice(index, 0, deepCloneNode(op.node));
      const nextDoc = op.path.length > 0 ? replaceAt(doc, op.path, nextParent) : nextParent;
      return {
        doc: nextDoc,
        inverse: { type: 'remove_node', path: op.path, index },
      };
    }
    case 'remove_node': {
      const parent = op.path.length > 0 ? getNodeAt(doc, op.path) : doc;
      const nextParent = cloneNode(parent);
      if (!nextParent.content || op.index < 0 || op.index >= nextParent.content.length) {
        throw new Error('remove_node out of bounds');
      }
      const [removed] = nextParent.content.splice(op.index, 1);
      const nextDoc = op.path.length > 0 ? replaceAt(doc, op.path, nextParent) : nextParent;
      return {
        doc: nextDoc,
        inverse: { type: 'insert_node', path: op.path, index: op.index, node: removed },
      };
    }
    default: {
      const _exhaustive: never = op;
      throw new Error(`Unknown op: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

export function applyOps(
  doc: DocNode,
  ops: Operation[],
  selection: Selection,
  schema?: Schema
): { doc: DocNode; selection: Selection; inverses: Operation[] } {
  let current = doc;
  let sel = selection;
  const inverses: Operation[] = [];
  for (const op of ops) {
    if (op.type === 'set_selection') {
      inverses.push({ type: 'set_selection', selection: sel });
      sel = clampSelection(current, op.selection);
      continue;
    }
    const result = applyOp(current, op, schema);
    current = result.doc;
    inverses.push(result.inverse);
    if (op.type === 'insert_text') {
      sel = collapsedAt(op.path, op.offset + op.text.length);
    } else if (op.type === 'delete_text') {
      sel = collapsedAt(op.path, op.offset);
    } else if (op.type === 'split_paragraph') {
      const parentPath = op.path.slice(0, -1);
      const index = op.path.at(-1);
      if (index === undefined) {
        throw new Error('split_paragraph path is empty');
      }
      sel = collapsedAt([...parentPath, index + 1], 0);
    } else if (op.type === 'merge_paragraph') {
      const inv = result.inverse;
      if (inv.type === 'split_paragraph') {
        sel = collapsedAt(inv.path, inv.offset);
      }
    } else if (op.type === 'insert_node') {
      const index = result.inverse.type === 'remove_node' ? result.inverse.index : op.index;
      sel = {
        anchor: {
          offset: sel.anchor.offset,
          path: remapPathSibling(sel.anchor.path, op.path, index, 1),
        },
        focus: {
          offset: sel.focus.offset,
          path: remapPathSibling(sel.focus.path, op.path, index, 1),
        },
      };
      sel = clampSelection(current, sel);
    } else if (op.type === 'remove_node') {
      sel = {
        anchor: {
          offset: sel.anchor.offset,
          path: remapPathSibling(sel.anchor.path, op.path, op.index, -1),
        },
        focus: {
          offset: sel.focus.offset,
          path: remapPathSibling(sel.focus.path, op.path, op.index, -1),
        },
      };
      sel = clampSelection(current, sel);
    } else {
      sel = clampSelection(current, sel);
    }
  }
  return { doc: current, selection: clampSelection(current, sel), inverses: inverses.toReversed() };
}

function remapPathSibling(
  path: number[],
  parent: number[],
  index: number,
  delta: 1 | -1
): number[] {
  const d = parent.length;
  if (path.length <= d) {
    return path;
  }
  for (let i = 0; i < d; i++) {
    if (path[i] !== parent[i]) {
      return path;
    }
  }
  const at = path[d];
  if (at === undefined) {
    return path;
  }
  if (delta < 0 && at === index) {
    return path;
  }
  if ((delta > 0 && at >= index) || (delta < 0 && at > index)) {
    const next = [...path];
    next[d] = at + delta;
    return next;
  }
  return path;
}

export function selectionTextRange(
  sel: Selection
): { path: number[]; from: number; to: number } | null {
  const { from, to } = orderedRange(sel);
  if (from.path.join('.') !== to.path.join('.')) {
    return null;
  }
  return { path: from.path, from: from.offset, to: to.offset };
}

export function ensureParagraphPath(doc: DocNode, path: number[]): number[] {
  if (path.length > 0) {
    return path;
  }
  // default first paragraph
  if (doc.content?.[0]) {
    return [0];
  }
  return [0];
}
