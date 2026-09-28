import { describe, expect, it } from 'vitest';
import { listLocales, loadLocale } from '../loadLocale';

describe('loadLocale', () => {
  it('lists en plus lazy locale codes sorted', () => {
    const codes = listLocales();
    expect(codes).toContain('en');
    expect(codes).toContain('ru');
    expect(codes).toStrictEqual([...codes].toSorted((a, b) => a.localeCompare(b)));
  });

  it('returns null for en and unknown codes', async () => {
    await expect(loadLocale('en')).resolves.toBeNull();
    await expect(loadLocale('zz-not-a-locale')).resolves.toBeNull();
  });

  it('loads a shipped non-en locale dict', async () => {
    const ru = await loadLocale('ru');
    expect(ru).not.toBeNull();
    expect(typeof ru).toBe('object');
  });
});
