import { describe, expect, it } from 'vitest';
import { renderDetached } from '@codemerge/sdk';
import { allFieldTypes } from '../types';
import { createField, getDriver } from '../drivers/registry';

const stubI18n = { t: (k: string) => k };

describe('fieldView.smoke', () => {
  it('renderDetached for every FieldType defaults without throw', () => {
    for (const type of allFieldTypes()) {
      const field = createField(type, stubI18n);
      expect(() => {
        const { el, destroy } = renderDetached(getDriver(type).render(field));
        expect(el).toBeTruthy();
        destroy();
      }).not.toThrow();
    }
  });

  it('radio render keeps distinct option values (attrs not overwritten)', () => {
    const field = createField('radio', stubI18n, 'r1');
    const { el, destroy } = renderDetached(getDriver('radio').render(field));
    const radios = [...el.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
    expect(radios.length).toBeGreaterThan(1);
    const values = radios.map((r) => r.value);
    expect(new Set(values).size).toBe(values.length);
    expect(el.querySelectorAll('.checkbox-container').length).toBe(values.length);
    destroy();
  });
});
