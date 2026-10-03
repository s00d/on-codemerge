/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { emptyEditorDoc, isCodeEditorDoc, languageFromDoc, textFromDoc } from '../io/adapters';
import { parseText, serializeText } from '../io/text';

describe('code editor io', () => {
  it('emptyEditorDoc is code SoT', () => {
    expect.hasAssertions();
    const doc = emptyEditorDoc('hello', 'ts');
    expect(isCodeEditorDoc(doc)).toBe(true);
    expect(textFromDoc(doc)).toBe('hello');
    expect(languageFromDoc(doc)).toBe('ts');
  });

  it('parseText / serializeText round-trip', () => {
    expect.hasAssertions();
    const result = parseText('a\nb', 'js');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(serializeText(result.doc)).toBe('a\nb');
    expect(languageFromDoc(result.doc)).toBe('js');
  });

  it('rejects oversized text', () => {
    expect.hasAssertions();
    const huge = 'x'.repeat(2_000_001);
    const result = parseText(huge);
    expect(result.ok).toBe(false);
  });
});
