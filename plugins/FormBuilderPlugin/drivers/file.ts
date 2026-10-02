import { h } from '@codemerge/sdk';
import type { FieldOptions } from '../types';
import { coerceField } from './coerce';
import { wrappedInput } from './shared';
import type { FieldDriver, FormI18n } from './types';

const OPTION_KEYS = [
  'name',
  'id',
  'className',
  'disabled',
  'accept',
  'multiple',
] as const satisfies readonly (keyof FieldOptions)[];

export const fileDriver: FieldDriver = {
  type: 'file',
  family: 'file',
  nameKey: 'formBuilder.type.file',
  palette: true,
  optionKeys: OPTION_KEYS,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.newField') || 'New field',
    options: { accept: '' },
    validation: { required: false },
  }),
  coerce: (from) => coerceField(from, 'file', OPTION_KEYS),
  render: (field) =>
    wrappedInput(field, 'file', {
      accept: field.options?.accept,
      multiple: field.options?.multiple ? true : undefined,
    }),
  inspector: (ctx) => {
    const opts = ctx.field.options ?? {};
    return h('div', null, [
      h('div', { class: 'setting-group mb-3' }, [
        h('label', { class: 'block text-sm text-gray-700 mb-1' }, 'Accept'),
        h('input', {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          attrs: { type: 'text', placeholder: 'image/*,.pdf' },
          props: { value: opts.accept ?? '' },
          on: {
            input: (e) => {
              const t = e.target;
              if (t instanceof HTMLInputElement) {
                ctx.patchOptions({ accept: t.value });
              }
            },
          },
        }),
      ]),
      h('label', { class: 'flex cursor-pointer items-center gap-2 mb-3' }, [
        h('input', {
          class: 'form-checkbox',
          attrs: { type: 'checkbox' },
          props: { checked: !!opts.multiple },
          on: {
            change: (e) => {
              const t = e.target;
              if (t instanceof HTMLInputElement) {
                ctx.patchOptions({ multiple: t.checked });
              }
            },
          },
        }),
        'Multiple files',
      ]),
    ]);
  },
};
