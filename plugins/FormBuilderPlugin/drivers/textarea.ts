import { h } from '@codemerge/sdk';
import type { FieldOptions } from '../types';
import { coerceField } from './coerce';
import { fieldCommonAttrs, fieldName, labelNode, wrapClass } from './shared';
import type { FieldDriver, FormI18n } from './types';

const OPTION_KEYS = [
  'name',
  'id',
  'placeholder',
  'value',
  'className',
  'readonly',
  'disabled',
  'rows',
  'cols',
  'maxlength',
  'minlength',
] as const satisfies readonly (keyof FieldOptions)[];

export const textareaDriver: FieldDriver = {
  type: 'textarea',
  family: 'textarea',
  nameKey: 'formBuilder.type.textarea',
  palette: true,
  optionKeys: OPTION_KEYS,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.newField') || 'New field',
    options: { rows: 4, placeholder: '' },
    validation: { required: false },
  }),
  coerce: (from) =>
    coerceField(from, 'textarea', OPTION_KEYS, {
      rows: from.options?.rows ?? 4,
    }),
  render: (field) => {
    const { value: _v, ...taAttrs } = fieldCommonAttrs(field);
    void _v;
    return h('div', { class: wrapClass(field) }, [
      labelNode(field),
      h('textarea', {
        attrs: {
          id: field.id,
          name: fieldName(field),
          rows: field.options?.rows,
          cols: field.options?.cols,
          ...taAttrs,
        },
        props: { value: field.options?.value ?? '' },
      }),
    ]);
  },
  inspector: (ctx) => {
    const opts = ctx.field.options ?? {};
    return h('div', null, [
      h('div', { class: 'setting-group mb-3' }, [
        h(
          'label',
          { class: 'block text-sm text-gray-700 mb-1' },
          ctx.i18n.t('formBuilder.defaultValue') || 'Default value'
        ),
        h('textarea', {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          attrs: { rows: 3 },
          props: { value: opts.value ?? '' },
          on: {
            input: (e) => {
              const t = e.target;
              if (t instanceof HTMLTextAreaElement) {
                ctx.patchOptions({ value: t.value });
              }
            },
          },
        }),
      ]),
      h('div', { class: 'setting-group mb-3' }, [
        h('label', { class: 'block text-sm text-gray-700 mb-1' }, 'Rows'),
        h('input', {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          attrs: { type: 'number', min: '1' },
          props: { value: String(opts.rows ?? 4) },
          on: {
            input: (e) => {
              const t = e.target;
              if (t instanceof HTMLInputElement) {
                ctx.patchOptions({ rows: Number(t.value) || 4 });
              }
            },
          },
        }),
      ]),
    ]);
  },
};
