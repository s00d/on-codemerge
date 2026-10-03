import { describe, expect, it } from 'vitest';
import { allFieldTypes } from '../types';
import { createField, getDriver, validateFieldForDriver } from '../drivers/registry';

const stubI18n = { t: (k: string) => k };

describe('drivers.coerce', () => {
  it('fromType × toType preserves id and validates', () => {
    const types = allFieldTypes();
    for (const from of types) {
      const source = createField(from, stubI18n, `keep_${from}`);
      for (const to of types) {
        const driver = getDriver(to);
        const coerced = driver.coerce({ ...source, type: to });
        expect(coerced.id).toBe(source.id);
        expect(coerced.type).toBe(to);
        expect(validateFieldForDriver(coerced, driver)).toBe(true);
      }
    }
  });

  it('self-coerce is stable for required shape', () => {
    for (const type of allFieldTypes()) {
      const d = getDriver(type);
      const field = createField(type, stubI18n);
      const again = d.coerce(field);
      expect(again.id).toBe(field.id);
      expect(again.type).toBe(type);
      expect(validateFieldForDriver(again, d)).toBe(true);
    }
  });

  it('select coerce fills empty choices', () => {
    const from = createField('text', stubI18n, 'x');
    const coerced = getDriver('select').coerce({ ...from, type: 'select' });
    expect(coerced.options?.options?.length).toBeGreaterThan(0);
  });
});
