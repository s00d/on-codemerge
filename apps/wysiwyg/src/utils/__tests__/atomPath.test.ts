import { describe, expect, it } from 'vitest';
import { createDoc, createParagraph, createText } from '@codemerge/kernel';
import { nodeAtPath, pathFromEl } from '../atomPath';

describe('atomPath.nodeAtPath', () => {
  it('returns null for null/empty path', () => {
    const doc = createDoc([createParagraph([createText('a')])]);
    expect(nodeAtPath(doc, null)).toBeNull();
  });

  it('walks nested content', () => {
    const doc = createDoc([createParagraph([createText('hi')])]);
    const para = nodeAtPath(doc, [0]);
    expect(para?.type).toBe('paragraph');
    const text = nodeAtPath(doc, [0, 0]);
    expect(text?.type).toBe('text');
    expect(text?.text).toBe('hi');
  });

  it('returns null when index is out of range', () => {
    const doc = createDoc([createParagraph([createText('a')])]);
    expect(nodeAtPath(doc, [9])).toBeNull();
    expect(nodeAtPath(doc, [0, 9])).toBeNull();
  });

  it('pathFromEl still reads data-ocm-path', () => {
    const el = document.createElement('div');
    el.dataset.ocmPath = '0.1';
    expect(pathFromEl(el)).toStrictEqual([0, 1]);
  });
});
