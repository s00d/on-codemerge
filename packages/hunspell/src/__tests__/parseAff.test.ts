import { describe, expect, it } from 'vitest';
import { loadMini } from './fixtures/dictionaries';

describe('parseAff / parseDic (mini fixture)', () => {
  it('expands SFX forms into the dictionary', () => {
    const dict = loadMini();
    expect(dict.check('cat')).toBe(true);
    expect(dict.check('cats')).toBe(true);
    expect(dict.check('dog')).toBe(true);
    expect(dict.check('dogs')).toBe(true);
    expect(dict.check('fishes')).toBe(false);
  });

  it('expands PFX forms', () => {
    const dict = loadMini();
    expect(dict.check('unhappy')).toBe(true);
    expect(dict.check('unhappys')).toBe(true);
  });

  it('honours NEEDAFFIX — stem alone is not valid', () => {
    const dict = loadMini();
    expect(dict.checkExact('bind')).toBe(false);
    expect(dict.check('bound')).toBe(true);
  });
});
