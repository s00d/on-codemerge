import { describe, expect, it } from 'vitest';
import {
  allJsonLeafTypes,
  DRIVERS,
  getDriver,
  defaultValueForType,
  typeLabel,
} from '../drivers/registry';

describe('json drivers.registry', () => {
  it('registers every JsonLeafType', () => {
    const types = allJsonLeafTypes();
    expect(types).toHaveLength(6);
    for (const type of types) {
      const d = getDriver(type);
      expect(d.type).toBe(type);
      expect(DRIVERS[type]).toBe(d);
      expect(d.label).toBeTruthy();
      expect(typeLabel(type)).toBe(d.label);
    }
  });

  it('scalars have leafView; containers do not', () => {
    expect(getDriver('jsonString').leafView).toBeTruthy();
    expect(getDriver('jsonNumber').leafView).toBeTruthy();
    expect(getDriver('jsonBoolean').leafView).toBeTruthy();
    expect(getDriver('jsonNull').leafView).toBeTruthy();
    expect(getDriver('jsonObject').leafView).toBeNull();
    expect(getDriver('jsonArray').leafView).toBeNull();
  });

  it('defaults match type shape', () => {
    expect(defaultValueForType('jsonString')).toBe('');
    expect(defaultValueForType('jsonNumber')).toBe(0);
    expect(defaultValueForType('jsonBoolean')).toBe(false);
    expect(defaultValueForType('jsonNull')).toBeNull();
    expect(defaultValueForType('jsonArray')).toStrictEqual([]);
    expect(defaultValueForType('jsonObject')).toStrictEqual({});
  });
});
