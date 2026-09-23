import { describe, expect, it } from 'vitest';
import { tokenize } from '../utils/tokenize';
import { parseMath } from '../utils/parse';
import { astToMathML } from '../utils/mathml';

describe('math tokenize', () => {
  it('splits commands and scripts', () => {
    expect.hasAssertions();
    const toks = tokenize(String.raw`\frac{a}{b}`);
    expect(toks.map((t) => t.kind)).toEqual([
      'command',
      'lbrace',
      'char',
      'rbrace',
      'lbrace',
      'char',
      'rbrace',
    ]);
    expect(tokenize('x^2').map((t) => t.kind)).toEqual(['char', 'sup', 'char']);
  });
});

describe('math parse', () => {
  it('parses frac sqrt sum and scripts', () => {
    expect.hasAssertions();
    const frac = parseMath(String.raw`\frac{a}{b}`);
    expect(frac.ok).toBe(true);
    if (frac.ok) {
      expect(frac.ast.type).toBe('frac');
    }

    const sq = parseMath(String.raw`\sqrt{x+1}`);
    expect(sq.ok).toBe(true);
    if (sq.ok) {
      expect(sq.ast.type).toBe('sqrt');
    }

    const pow = parseMath('x^2');
    expect(pow.ok).toBe(true);
    if (pow.ok) {
      expect(pow.ast.type).toBe('sup');
    }

    const sum = parseMath(String.raw`\sum_{i=1}^{n}`);
    expect(sum.ok).toBe(true);
    if (sum.ok) {
      expect(sum.ast.type).toBe('largeOp');
      if (sum.ast.type === 'largeOp') {
        expect(sum.ast.sub).toBeTruthy();
        expect(sum.ast.exp).toBeTruthy();
      }
    }
  });

  it('rejects empty', () => {
    expect.hasAssertions();
    expect(parseMath('').ok).toBe(false);
  });
});

describe('math mathml', () => {
  it('emits math root with mfrac and msup', () => {
    expect.hasAssertions();
    const frac = parseMath(String.raw`\frac{a}{b}`);
    expect(frac.ok).toBe(true);
    if (frac.ok) {
      const m = astToMathML(frac.ast);
      expect(m.tagName.toLowerCase()).toBe('math');
      expect(m.querySelector('mfrac')).toBeTruthy();
    }
    const pow = parseMath('x^2');
    expect(pow.ok).toBe(true);
    if (pow.ok) {
      const m = astToMathML(pow.ast);
      expect(m.querySelector('msup')).toBeTruthy();
    }
  });
});
