import { beforeAll, describe, expect, it } from 'vitest';
import type { HunspellDictionary } from '../../index';
import { getDictionaryEn } from './fixtures/dictionaries';
import { EN_CHECK_CORPUS, EN_SUGGEST_CORPUS } from './fixtures/en.integration.corpus';

describe('dictionary-en integration', () => {
  let dict: HunspellDictionary;

  beforeAll(() => {
    dict = getDictionaryEn();
  });

  it.each(EN_CHECK_CORPUS)('$id', (row) => {
    expect(dict.check(row.word)).toBe(row.check);
    if (row.checkExact !== undefined) {
      expect(dict.checkExact(row.word)).toBe(row.checkExact);
    }
  });

  it.each(EN_SUGGEST_CORPUS)('$id', (row) => {
    const suggestions = dict.suggest(row.input, row.limit ?? 5);
    for (const want of row.mustInclude ?? []) {
      expect(suggestions).toContain(want);
    }
    for (const ban of row.mustExclude ?? []) {
      expect(suggestions).not.toContain(ban);
    }
  });
});
