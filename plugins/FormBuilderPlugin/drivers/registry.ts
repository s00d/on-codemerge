import type { FieldConfig, FieldType } from '../types';
import { allFieldTypes } from '../types';
import { makeButtonDriver } from './button';
import { checkboxDriver } from './checkbox';
import { radioDriver, selectDriver } from './choice';
import { fileDriver } from './file';
import { hiddenDriver } from './hidden';
import { imageDriver } from './image';
import { inputDriver } from './input';
import { dividerDriver, headingDriver } from './layout';
import { textareaDriver } from './textarea';
import type { FieldDriver, FormI18n } from './types';

export const DRIVERS: Record<FieldType, FieldDriver> = {
  heading: headingDriver,
  divider: dividerDriver,
  text: inputDriver('text'),
  email: inputDriver('email'),
  password: inputDriver('password'),
  number: inputDriver('number'),
  tel: inputDriver('tel'),
  url: inputDriver('url'),
  date: inputDriver('date'),
  time: inputDriver('time'),
  'datetime-local': inputDriver('datetime-local'),
  month: inputDriver('month'),
  week: inputDriver('week'),
  color: inputDriver('color'),
  range: inputDriver('range'),
  textarea: textareaDriver,
  select: selectDriver,
  radio: radioDriver,
  checkbox: checkboxDriver,
  file: fileDriver,
  button: makeButtonDriver('button'),
  submit: makeButtonDriver('submit'),
  reset: makeButtonDriver('reset'),
  hidden: hiddenDriver,
  image: imageDriver,
};

export function getDriver(type: FieldType): FieldDriver {
  return DRIVERS[type];
}

export function paletteFieldTypes(): FieldType[] {
  return allFieldTypes().filter((t) => DRIVERS[t].palette);
}

export function createField(type: FieldType, i18n: FormI18n, id?: string): FieldConfig {
  const driver = getDriver(type);
  const defaults = driver.defaults(i18n);
  const fieldId = id ?? `field_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  return driver.coerce({
    id: fieldId,
    type,
    label: defaults.label,
    options: { name: fieldId, ...defaults.options },
    validation: defaults.validation,
  });
}

/** Soft check used by tests / IO harden. */
export function validateFieldForDriver(field: FieldConfig, driver: FieldDriver): boolean {
  if (field.type !== driver.type) {
    return false;
  }
  if (!field.id) {
    return false;
  }
  if (driver.supportsChoices) {
    const choices = field.options?.options;
    if (!choices || choices.length === 0) {
      return false;
    }
  }
  return true;
}
