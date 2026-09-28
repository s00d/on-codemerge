/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach } from 'vitest';
import { clearFontCache, isLocalFontAvailable, listAvailableFonts } from '../detectFonts';
import { SYSTEM_FONT } from '../../constants';

describe('detectFonts', () => {
  afterEach(() => {
    clearFontCache();
  });

  it('always includes system font', async () => {
    expect.hasAssertions();
    // jsdom measureText is stubby — list still returns at least System
    const fonts = await listAvailableFonts();
    expect(fonts[0]?.id).toBe(SYSTEM_FONT.id);
    expect(fonts.some((f) => f.label === 'System')).toBe(true);
  });

  it('isLocalFontAvailable does not throw', () => {
    expect.hasAssertions();
    expect(() => isLocalFontAvailable('Arial')).not.toThrow();
  });
});
