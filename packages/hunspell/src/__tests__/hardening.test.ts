import { describe, expect, it } from 'vitest';
import { createDictionary } from '../index';
import { MAX_AFFIX_ENTRIES } from '../limits';

describe('hunspell hardening bounds', () => {
  it('rejects oversized dictionary payloads', () => {
    const huge = 'x'.repeat(8_388_609);
    expect(() => createDictionary(huge, '1\ncat\n')).toThrow(/too large/);
    expect(() => createDictionary('SET UTF-8\n', huge)).toThrow(/too large/);
  });

  it('skips absurd affix entry counts without hanging', () => {
    const aff = `SET UTF-8\nSFX S Y ${MAX_AFFIX_ENTRIES + 1}\n`;
    const t0 = performance.now();
    const dict = createDictionary(aff, '1\ncat\n');
    expect(performance.now() - t0).toBeLessThan(500);
    expect(dict.check('cat')).toBe(true);
  });

  it('escapes metacharacters in compound stems', () => {
    const aff = `SET UTF-8\nCOMPOUNDMIN 1\nCOMPOUNDRULE 1\nCOMPOUNDRULE ab\n`;
    const dic = `2\na./a\nb/b\n`;
    // Stem `a.` must not become "any char" via unescaped `.` in compound regex.
    const dict = createDictionary(aff, dic);
    expect(dict.check('a.b')).toBe(true);
    expect(dict.check('axb')).toBe(false);
  });

  it('returns empty suggest for overlong words', () => {
    const dict = createDictionary('SET UTF-8\n', '1\ncat\n');
    expect(dict.suggest('x'.repeat(65))).toStrictEqual([]);
  });
});
