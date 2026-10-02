import type { FieldOptions } from '../types';
import { coerceField } from './coerce';
import { fieldCommonAttrs, fieldName } from './shared';
import type { FieldDriver, FormI18n } from './types';
import { h } from '@codemerge/sdk';

const OPTION_KEYS = [
  'name',
  'id',
  'value',
  'className',
  'disabled',
] as const satisfies readonly (keyof FieldOptions)[];

export function makeButtonDriver(type: 'button' | 'submit' | 'reset'): FieldDriver {
  return {
    type,
    family: 'button',
    nameKey: `formBuilder.type.${type}`,
    palette: false,
    optionKeys: OPTION_KEYS,
    defaults: (i18n: FormI18n) => ({
      label:
        type === 'submit'
          ? i18n.t('formBuilder.submit') || 'Submit'
          : type === 'reset'
            ? i18n.t('formBuilder.reset') || 'Reset'
            : i18n.t('formBuilder.button') || 'Button',
      options: {},
      validation: { required: false },
    }),
    coerce: (from) => coerceField(from, type, OPTION_KEYS),
    render: (field) =>
      h(
        'button',
        {
          attrs: {
            type,
            id: field.id,
            name: fieldName(field),
            ...fieldCommonAttrs(field),
          },
        },
        field.label || type
      ),
    inspector: () => null,
  };
}
