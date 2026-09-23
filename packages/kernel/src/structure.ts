import type { DocNode } from './types';
import type { Operation } from './operations';
import { createParagraph, createText, deepCloneNode, getNodeAt, textLength } from './document';

const TEXT_BLOCKS = new Set(['paragraph', 'heading', 'listItem', 'blockquote', 'codeBlock']);
const LIST_TYPES = new Set(['bulletList', 'orderedList']);

export function isTextBlock(type: string): boolean {
  return TEXT_BLOCKS.has(type);
}

export function isListType(type: string): boolean {
  return LIST_TYPES.has(type);
}

/** Flatten text of a text-bearing node (paragraph / heading / listItem). */
export function plainText(node: DocNode): string {
  if (node.type === 'text') {
    return node.text ?? '';
  }
  let out = '';
  for (const child of node.content ?? []) {
    if (child.type === 'text') {
      out += child.text ?? '';
    } else if (child.content) {
      out += plainText(child);
    }
  }
  return out;
}

/**
 * Resolve selection path to a text-bearing leaf.
 * Lists → first/only item; listItem → nested paragraph; table → first cell paragraph.
 */
export function resolveTextPath(doc: DocNode, path: number[]): number[] {
  if (path.length === 0) {
    return [0];
  }
  let cur = getNodeAt(doc, path);
  const resolved = [...path];

  if (isListType(cur.type)) {
    if ((cur.content?.length ?? 0) === 0) {
      return resolved;
    }
    resolved.push(0);
    cur = cur.content![0];
  }

  if (cur.type === 'table') {
    const row = cur.content?.[0];
    const cell = row?.content?.[0];
    if (row && cell) {
      resolved.push(0, 0);
      cur = cell;
    }
  }

  if (cur.type === 'tableRow') {
    const cell = cur.content?.[0];
    if (cell) {
      resolved.push(0);
      cur = cell;
    }
  }

  if (cur.type === 'tableCell') {
    const para = cur.content?.[0];
    if (para && isTextBlock(para.type)) {
      resolved.push(0);
      cur = para;
    } else if (!para) {
      // empty cell — still point at cell; caller may create para
      return resolved;
    }
  }

  // listItem with nested paragraph (or other text block) → descend to leaf
  if (cur.type === 'listItem') {
    const first = cur.content?.[0];
    if (first && first.type !== 'text' && isTextBlock(first.type) && first.type !== 'listItem') {
      resolved.push(0);
      cur = first;
    }
  }

  // blockquote / codeBlock → descend into first nested text block
  if (cur.type === 'blockquote' || cur.type === 'codeBlock') {
    const first = cur.content?.[0];
    if (first && isTextBlock(first.type)) {
      resolved.push(0);
      // re-enter via recurse on extended path
      return resolveTextPath(doc, resolved);
    }
  }

  return resolved;
}

export function createListItem(content: DocNode[] = [createText('')]): DocNode {
  return { type: 'listItem', content: [...content] };
}

export function createList(listType: 'bulletList' | 'orderedList', items: DocNode[]): DocNode {
  return {
    type: listType,
    id: `list_${Date.now()}`,
    content: items.length > 0 ? items : [createListItem()],
  };
}

/** Extract a paragraph to lift out of a list item. */
function liftedParagraphFromItem(item: DocNode): DocNode {
  const content = item.content ?? [];
  const first = content[0];
  if (first !== undefined && first.type === 'paragraph') {
    return deepCloneNode(first);
  }
  if (
    first !== undefined &&
    isTextBlock(first.type) &&
    first.type !== 'listItem' &&
    !isListType(first.type)
  ) {
    return deepCloneNode(first);
  }
  // Flat listItem with inline content (text / hardBreak)
  return createParagraph(content.length > 0 ? content.map(deepCloneNode) : [createText('')]);
}

/**
 * Lift list item `itemIndex` out of the list at `listPath` into the list's parent.
 * Removes the list, reinserts before-list (if any), lifted paragraph, after-list (if any).
 */
export function liftIntoParent(
  doc: DocNode,
  listPath: number[],
  itemIndex: number
): { ops: Operation[]; selectionPath: number[]; liftedIndex: number } {
  const list = getNodeAt(doc, listPath);
  const items = list.content ?? [];
  const listIndex = listPath.at(-1);
  if (listIndex === undefined) {
    throw new Error('liftIntoParent: empty list path');
  }
  const parentPath = listPath.slice(0, -1);
  const item = items[itemIndex];
  if (item === undefined) {
    throw new Error('liftIntoParent: item out of bounds');
  }

  const before = items.slice(0, itemIndex);
  const after = items.slice(itemIndex + 1);
  const para = liftedParagraphFromItem(item);
  const ops: Operation[] = [];

  ops.push({ type: 'remove_node', path: parentPath, index: listIndex });

  let insertAt = listIndex;
  if (before.length > 0) {
    ops.push({
      type: 'insert_node',
      path: parentPath,
      index: insertAt,
      node: { ...list, content: before, id: `list_${Date.now()}_a` },
    });
    insertAt += 1;
  }
  ops.push({ type: 'insert_node', path: parentPath, index: insertAt, node: para });
  const liftedIndex = insertAt;
  const selectionPath = [...parentPath, insertAt];
  insertAt += 1;
  if (after.length > 0) {
    ops.push({
      type: 'insert_node',
      path: parentPath,
      index: insertAt,
      node: { ...list, content: after, id: `list_${Date.now()}_b` },
    });
  }

  return { ops, selectionPath, liftedIndex };
}

/** Exit empty list item: lift to paragraph in the list's parent (any depth). */
export function exitListItemOps(
  doc: DocNode,
  listPath: number[],
  itemIndex: number
): { ops: Operation[]; selectionPath: number[] } {
  const { ops, selectionPath } = liftIntoParent(doc, listPath, itemIndex);
  return { ops, selectionPath };
}

export function textBlockLength(doc: DocNode, path: number[]): number {
  try {
    return textLength(getNodeAt(doc, path));
  } catch {
    return 0;
  }
}
