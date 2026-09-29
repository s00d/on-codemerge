import { describe, expect, it } from 'vitest';
import { loadMini } from './fixtures/dictionaries';

describe('check', () => {
  it('accepts known words and rejects unknowns', () => {
    const dict = loadMini();
    expect(dict.check('cat')).toBe(true);
    expect(dict.check('fish')).toBe(true);
    expect(dict.check('zxqwy')).toBe(false);
  });

  it('folds Capitalized → lowercase', () => {
    const dict = loadMini();
    expect(dict.check('Cat')).toBe(true);
    expect(dict.check('FISH')).toBe(true);
  });

  it('honours KEEPCASE — only exact casing allowed', () => {
    const dict = loadMini();
    expect(dict.check('Beautiful')).toBe(true);
    expect(dict.check('beautiful')).toBe(false);
    expect(dict.check('BEAUTIFUL')).toBe(false);
  });

  it('returns false for empty input', () => {
    const dict = loadMini();
    expect(dict.check('')).toBe(false);
  });
});
