import { h } from '@codemerge/sdk';
import type { FieldOptions } from '../types';
import { coerceField } from './coerce';
import { fieldCommonAttrs, fieldName } from './shared';
import type { FieldDriver, FormI18n } from './types';

const OPTION_KEYS = [
  'name',
  'id',
  'value',
  'className',
] as const satisfies readonly (keyof FieldOptions)[];

export const hiddenDriver: FieldDriver = {
  type: 'hidden',
  family: 'hidden',
  nameKey: 'formBuilder.type.hidden',
  palette: true,
  optionKeys: OPTION_KEYS,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.hiddenField') || 'Hidden',
    options: { value: '' },
    validation: { required: false },
  }),
  coerce: (from) => coerceField(from, 'hidden', OPTION_KEYS),
  render: (field) =>
    h('input', {
      attrs: {
        type: 'hidden',
        id: field.id,
        name: fieldName(field),
        ...fieldCommonAttrs(field),
      },
    }),
  inspector: (ctx) =>
    h('div', { class: 'setting-group mb-3' }, [
      h(
        'label',
        { class: 'block text-sm text-gray-700 mb-1' },
        ctx.i18n.t('formBuilder.defaultValue') || 'Value'
      ),
      h('input', {
        class: 'form-input w-full p-2 border border-gray-300 rounded-md',
        attrs: { type: 'text' },
        props: { value: ctx.field.options?.value ?? '' },
        on: {
          input: (e) => {
            const t = e.target;
            if (t instanceof HTMLInputElement) {
              ctx.patchOptions({ value: t.value });
            }
          },
        },
      }),
    ]),
};
