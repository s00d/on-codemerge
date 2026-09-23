import type { DocNode } from './types';
import { cloneNode, createText, nextId } from './document';
import { isListType, isTextBlock } from './structure';

/** Idempotent normalize: ensure doc has content, text blocks have text leaves, coalesce adjacent same-mark texts. */
export function normalize(doc: DocNode): DocNode {
  if (doc.type !== 'doc') {
    throw new Error('normalize expects doc');
  }
  const next = cloneNode(doc);
  if (!next.content || next.content.length === 0) {
    next.content = [{ content: [createText('')], id: 'p_empty', type: 'paragraph' }];
    return next;
  }
  next.content = next.content.map(normalizeBlock);
  if (next.content.length === 0) {
    next.content = [{ content: [createText('')], id: 'p_empty', type: 'paragraph' }];
  }
  return next;
}

function normalizeBlock(node: DocNode): DocNode {
  if (node.type === 'text') {
    return node;
  }
  const cloned = cloneNode(node);
  if (!cloned.content || cloned.content.length === 0) {
    if (isListType(node.type)) {
      return {
        type: 'paragraph',
        id: nextId('p'),
        content: [createText('')],
      };
    }
    if (isTextBlock(node.type)) {
      cloned.content = [createText('')];
    }
    return cloned;
  }
  if (isTextBlock(node.type)) {
    cloned.content = coalesceText(cloned.content.map(normalizeBlock));
    if (cloned.content.length === 0) {
      cloned.content = [createText('')];
    }
  } else {
    cloned.content = cloned.content.map(normalizeBlock);
    if (isListType(node.type)) {
      cloned.content = cloned.content.filter((c) => {
        if (c.type !== 'listItem') {
          return true;
        }
        return (c.content?.length ?? 0) > 0;
      });
      if (cloned.content.length === 0) {
        return {
          type: 'paragraph',
          id: nextId('p'),
          content: [createText('')],
        };
      }
    }
  }
  return cloned;
}

function coalesceText(nodes: DocNode[]): DocNode[] {
  const out: DocNode[] = [];
  for (const n of nodes) {
    if (n.type !== 'text') {
      out.push(n);
      continue;
    }
    const prev = out.at(-1);
    if (
      prev?.type === 'text' &&
      JSON.stringify(prev.marks ?? []) === JSON.stringify(n.marks ?? [])
    ) {
      out[out.length - 1] = {
        ...prev,
        text: (prev.text ?? '') + (n.text ?? ''),
      };
    } else {
      out.push(n);
    }
  }
  return out;
}

export function isNormalizeIdempotent(doc: DocNode): boolean {
  const a = normalize(doc),
    b = normalize(a);
  return JSON.stringify(a) === JSON.stringify(b);
}
