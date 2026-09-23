import { describe, expect, it } from 'vitest';
import { SyntaxHighlighter } from '../services/SyntaxHighlighter';
import { getLanguageDefinition, isLanguageSupported } from '../utils/languages';

describe('syntaxHighlighter', () => {
  it('highlights javascript without throwing on sticky patterns', () => {
    expect.hasAssertions();
    const highlighter = new SyntaxHighlighter();
    const html = highlighter.highlightHtml('const x = 1;', 'javascript');
    expect(html).toContain('token');
    expect(html).toContain('const');
  });

  it('resolves js/ts/jsx/tsx/scss/c aliases', () => {
    expect.hasAssertions();
    expect(isLanguageSupported('js')).toBe(true);
    expect(isLanguageSupported('ts')).toBe(true);
    expect(isLanguageSupported('jsx')).toBe(true);
    expect(isLanguageSupported('tsx')).toBe(true);
    expect(isLanguageSupported('scss')).toBe(true);
    expect(isLanguageSupported('c')).toBe(true);
    expect(getLanguageDefinition('js')).toBe(getLanguageDefinition('javascript'));
    expect(getLanguageDefinition('ts')).toBe(getLanguageDefinition('typescript'));
  });
});
