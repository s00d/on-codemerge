import { describe, expect, it } from 'vitest';
import { allFieldTypes } from '../types';
import { createField, getDriver, validateFieldForDriver } from '../drivers/registry';

const stubI18n = { t: (k: string) => k };

describe('drivers.defaults', () => {
  it('defaults produce coercible valid fields with stable id', () => {
    for (const type of allFieldTypes()) {
      const field = createField(type, stubI18n, `id_${type}`);
      expect(field.id).toBe(`id_${type}`);
      expect(field.type).toBe(type);
      expect(field.label).toBeTruthy();
      expect(field.options?.name).toBeTruthy();
      expect(validateFieldForDriver(field, getDriver(type))).toBe(true);
    }
  });

  it('select/radio defaults include non-empty choices', () => {
    for (const type of ['select', 'radio'] as const) {
      const field = createField(type, stubI18n);
      expect(field.options?.options?.length).toBeGreaterThan(0);
    }
  });
});
