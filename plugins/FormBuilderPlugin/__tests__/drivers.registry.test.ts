import { describe, expect, it } from 'vitest';
import { allFieldTypes } from '../types';
import {
  DRIVERS,
  getDriver,
  paletteFieldTypes,
  validateFieldForDriver,
  createField,
} from '../drivers';

const stubI18n = { t: (k: string) => k };

describe('drivers.registry', () => {
  it('registers every FieldType', () => {
    const types = allFieldTypes();
    expect(types.length).toBeGreaterThanOrEqual(25);
    for (const type of types) {
      const d = getDriver(type);
      expect(d.type).toBe(type);
      expect(DRIVERS[type]).toBe(d);
      expect(d.optionKeys.length).toBeGreaterThan(0);
      expect(d.nameKey).toBeTruthy();
      expect(d.family).toBeTruthy();
    }
  });

  it('palette types are a subset of registered drivers', () => {
    const palette = paletteFieldTypes();
    expect(palette.length).toBeGreaterThan(0);
    for (const type of palette) {
      expect(getDriver(type).palette).toBe(true);
    }
    for (const type of allFieldTypes()) {
      expect(palette.includes(type)).toBe(getDriver(type).palette);
    }
  });

  it('choice drivers support choices', () => {
    expect(getDriver('select').supportsChoices).toBe(true);
    expect(getDriver('radio').supportsChoices).toBe(true);
    expect(getDriver('text').supportsChoices).toBeFalsy();
  });

  it('defaults validate against driver', () => {
    for (const type of allFieldTypes()) {
      const field = createField(type, stubI18n);
      expect(validateFieldForDriver(field, getDriver(type))).toBe(true);
    }
  });

  it('layout drivers are in palette', () => {
    expect(getDriver('heading').palette).toBe(true);
    expect(getDriver('divider').palette).toBe(true);
    expect(getDriver('heading').family).toBe('layout');
    expect(getDriver('divider').family).toBe('layout');
  });
});
