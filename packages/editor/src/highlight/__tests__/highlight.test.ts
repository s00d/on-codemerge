/**
 * @jest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import {
  highlightHtml,
  lex,
  tokensToHtml,
  HIGHLIGHT_MAX_CHARS,
  HIGHLIGHT_MAX_TOKENS,
} from '../index';

describe('universal highlight engine', () => {
  it('returns empty for empty input', () => {
    expect.hasAssertions();
    expect(highlightHtml('')).toBe('');
    expect(lex('')).toStrictEqual([]);
  });

  it('lex covers full input with structural types', () => {
    expect.hasAssertions();
    const tokens = lex('// hi\nfoo = 42;');
    const joined = tokens.map((t) => t.value).join('');
    expect(joined).toBe('// hi\nfoo = 42;');
    expect(tokens.some((t) => t.type === 'comment' && t.value.startsWith('//'))).toBe(true);
    expect(tokens.some((t) => t.type === 'ident' && t.value === 'foo')).toBe(true);
    expect(tokens.some((t) => t.type === 'number' && t.value === '42')).toBe(true);
    expect(tokens.some((t) => t.type === 'punctuation')).toBe(true);
  });

  it('escapes HTML values', () => {
    expect.hasAssertions();
    const html = highlightHtml('<script>"x"</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;');
    expect(html).toContain('&quot;x&quot;');
  });

  it('rejects forged token types at render', () => {
    expect.hasAssertions();
    const forged = { type: 'x" onmouseover="alert(1)', value: 'bad' };
    const html = tokensToHtml([
      { type: 'text', value: 'ok' },
      forged as unknown as { type: 'text'; value: string },
    ]);
    expect(html).toBe('okbad');
    expect(html).not.toContain('onmouseover');
    expect(html).not.toContain('class=');
  });

  it('highlights boolean literals and // comments', () => {
    expect.hasAssertions();
    const tokens = lex('true // note');
    expect(tokens.some((t) => t.type === 'boolean' && t.value === 'true')).toBe(true);
    expect(tokens.some((t) => t.type === 'comment' && t.value.startsWith('//'))).toBe(true);
  });

  it('does not paint MD headings or https URLs as comments', () => {
    expect.hasAssertions();
    const heading = lex('# Title');
    expect(heading.some((t) => t.type === 'comment')).toBe(false);
    const url = lex('https://example.com');
    expect(url.some((t) => t.type === 'comment')).toBe(false);
    expect(url.map((t) => t.value).join('')).toBe('https://example.com');
  });

  it('does not paint protocol-relative hosts as comments', () => {
    expect.hasAssertions();
    expect(lex('//example.com').some((t) => t.type === 'comment')).toBe(false);
    expect(lex('src=//cdn.example.com').some((t) => t.type === 'comment')).toBe(false);
    expect(lex('// hi').some((t) => t.type === 'comment')).toBe(true);
  });

  it('is language-agnostic: same paint for identical source', () => {
    expect.hasAssertions();
    expect(highlightHtml('const x = 1;')).toBe(highlightHtml('const x = 1;'));
  });

  it('oversized highlightHtml keeps full escaped text (no truncated mirror)', () => {
    expect.hasAssertions();
    const huge = `pre${'a'.repeat(HIGHLIGHT_MAX_CHARS)}post`;
    const html = highlightHtml(huge);
    expect(html.startsWith('pre')).toBe(true);
    expect(html.endsWith('post')).toBe(true);
    expect(html).not.toContain('<span');
  });

  it('lex caps token stream on oversized input', () => {
    expect.hasAssertions();
    const huge = 'a'.repeat(HIGHLIGHT_MAX_CHARS + 50);
    const tokens = lex(huge);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.value.length).toBe(HIGHLIGHT_MAX_CHARS);
  });

  it('token budget falls back to plain escaped text (no span DOM bomb)', () => {
    expect.hasAssertions();
    const dense = 'x,'.repeat(HIGHLIGHT_MAX_TOKENS);
    expect(lex(dense).length).toBeGreaterThan(HIGHLIGHT_MAX_TOKENS);
    const html = highlightHtml(dense);
    expect(html).not.toContain('<span');
    expect(html).toContain('x,');
  });
});
