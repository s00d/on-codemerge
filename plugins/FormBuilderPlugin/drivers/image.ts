import { h } from '@codemerge/sdk';
import type { FieldOptions } from '../types';
import { coerceField } from './coerce';
import { fieldCommonAttrs, fieldName } from './shared';
import type { FieldDriver, FormI18n } from './types';

const OPTION_KEYS = [
  'name',
  'id',
  'className',
  'disabled',
  'src',
  'alt',
] as const satisfies readonly (keyof FieldOptions)[];

export const imageDriver: FieldDriver = {
  type: 'image',
  family: 'image',
  nameKey: 'formBuilder.type.image',
  palette: false,
  optionKeys: OPTION_KEYS,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.imageButton') || 'Image',
    options: { src: '', alt: 'Submit' },
    validation: { required: false },
  }),
  coerce: (from) =>
    coerceField(from, 'image', OPTION_KEYS, {
      src: from.options?.src ?? '',
      alt: from.options?.alt ?? 'Submit',
    }),
  render: (field) =>
    h('input', {
      attrs: {
        type: 'image',
        id: field.id,
        name: fieldName(field),
        src: field.options?.src,
        alt: field.options?.alt,
        ...fieldCommonAttrs(field),
      },
    }),
  inspector: (ctx) => {
    const opts = ctx.field.options ?? {};
    return h('div', null, [
      h('div', { class: 'setting-group mb-3' }, [
        h('label', { class: 'block text-sm text-gray-700 mb-1' }, 'Src'),
        h('input', {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          attrs: { type: 'url' },
          props: { value: opts.src ?? '' },
          on: {
            input: (e) => {
              const t = e.target;
              if (t instanceof HTMLInputElement) {
                ctx.patchOptions({ src: t.value });
              }
            },
          },
        }),
      ]),
      h('div', { class: 'setting-group mb-3' }, [
        h('label', { class: 'block text-sm text-gray-700 mb-1' }, 'Alt'),
        h('input', {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          attrs: { type: 'text' },
          props: { value: opts.alt ?? '' },
          on: {
            input: (e) => {
              const t = e.target;
              if (t instanceof HTMLInputElement) {
                ctx.patchOptions({ alt: t.value });
              }
            },
          },
        }),
      ]),
    ]);
  },
};
