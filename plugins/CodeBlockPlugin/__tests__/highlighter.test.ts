import { describe, expect, it } from 'vitest';
import { highlightHtml, lex } from '@codemerge/editor';

describe('code block highlight', () => {
  it('paints structurally; identical source → identical tokens', () => {
    expect.hasAssertions();
    const src = 'const x = 1;';
    expect(
      lex(src)
        .map((t) => t.value)
        .join('')
    ).toBe(src);
    expect(highlightHtml(src)).toBe(highlightHtml(src));
    expect(lex(src).some((t) => t.type === 'number')).toBe(true);
    expect(lex(src).some((t) => t.type === 'keyword')).toBe(false);
  });
});
