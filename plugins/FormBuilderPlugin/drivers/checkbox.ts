import { h } from '@codemerge/sdk';
import type { FieldOptions } from '../types';
import { coerceField } from './coerce';
import { fieldCommonAttrs, fieldName, wrapClass } from './shared';
import type { FieldDriver, FormI18n } from './types';

const OPTION_KEYS = [
  'name',
  'id',
  'value',
  'className',
  'disabled',
  'checked',
] as const satisfies readonly (keyof FieldOptions)[];

export const checkboxDriver: FieldDriver = {
  type: 'checkbox',
  family: 'checkbox',
  nameKey: 'formBuilder.type.checkbox',
  palette: true,
  optionKeys: OPTION_KEYS,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.newField') || 'New field',
    options: {
      value: i18n.t('formBuilder.newCheckbox') || 'Checkbox',
      checked: false,
    },
    validation: { required: false },
  }),
  coerce: (from) =>
    coerceField(from, 'checkbox', OPTION_KEYS, {
      value: from.options?.value ?? from.label,
      checked: from.options?.checked ?? false,
    }),
  render: (field) => {
    const text = (field.options?.value ?? field.label) || '';
    return h('div', { class: wrapClass(field) }, [
      h('div', { class: 'checkbox-container' }, [
        h('input', {
          attrs: {
            type: 'checkbox',
            id: field.id,
            name: fieldName(field),
            checked: field.options?.checked ? true : undefined,
            ...fieldCommonAttrs(field),
          },
        }),
        text ? h('label', { attrs: { for: field.id } }, text) : null,
      ]),
    ]);
  },
  inspector: (ctx) => {
    const opts = ctx.field.options ?? {};
    return h('div', null, [
      h('div', { class: 'setting-group mb-3' }, [
        h(
          'label',
          { class: 'block text-sm text-gray-700 mb-1' },
          ctx.i18n.t('formBuilder.checkboxValue') || 'Checkbox label'
        ),
        h('input', {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          attrs: { type: 'text' },
          props: { value: opts.value ?? '' },
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
      h('label', { class: 'flex cursor-pointer items-center gap-2 mb-3' }, [
        h('input', {
          class: 'form-checkbox',
          attrs: { type: 'checkbox' },
          props: { checked: !!opts.checked },
          on: {
            change: (e) => {
              const t = e.target;
              if (t instanceof HTMLInputElement) {
                ctx.patchOptions({ checked: t.checked });
              }
            },
          },
        }),
        ctx.i18n.t('formBuilder.checkedByDefault') || 'Checked by default',
      ]),
    ]);
  },
};
