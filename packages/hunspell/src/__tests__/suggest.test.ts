import { describe, expect, it } from 'vitest';
import { loadCyrillic, loadMini } from './fixtures/dictionaries';

describe('suggest', () => {
  it('returns empty for correctly spelled words', () => {
    const dict = loadMini();
    expect(dict.suggest('cat')).toStrictEqual([]);
  });

  it('applies REP table (f ↔ ph)', () => {
    const dict = loadMini();
    expect(dict.suggest('phish')).toStrictEqual(['fish']);
  });

  it('suggests via edit distance', () => {
    const dict = loadMini();
    const suggestions = dict.suggest('catt', 5);
    expect(suggestions).toContain('cat');
  });

  it('respects limit', () => {
    const dict = loadMini();
    const suggestions = dict.suggest('catt', 1);
    expect(suggestions.length).toBeLessThanOrEqual(1);
  });

  it('excludes NOSUGGEST words from suggestions', () => {
    const dict = loadMini();
    const suggestions = dict.suggest('secrett', 10);
    expect(suggestions).not.toContain('secret');
  });

  it('suggests Cyrillic edits from TRY (not Latin-only alphabet)', () => {
    const dict = loadCyrillic();
    expect(dict.check('кот')).toBe(true);
    expect(dict.check('котт')).toBe(false);
    const suggestions = dict.suggest('котт', 5);
    expect(suggestions).toContain('кот');
    // Must not invent Latin garbage when TRY is Cyrillic-only.
    expect(suggestions.every((s) => /[а-яё]/i.test(s))).toBe(true);
  });
});
