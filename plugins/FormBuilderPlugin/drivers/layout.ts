import { h } from '@codemerge/sdk';
import type { FieldOptions } from '../types';
import { coerceField } from './coerce';
import type { FieldDriver, FormI18n } from './types';

const HEADING_KEYS = [
  'className',
  'description',
] as const satisfies readonly (keyof FieldOptions)[];
const DIVIDER_KEYS = ['className'] as const satisfies readonly (keyof FieldOptions)[];

export const headingDriver: FieldDriver = {
  type: 'heading',
  family: 'layout',
  nameKey: 'formBuilder.sectionHeading',
  palette: true,
  optionKeys: HEADING_KEYS,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.sectionHeading') || 'Section',
    options: { description: '' },
    validation: { required: false },
  }),
  coerce: (from) =>
    coerceField(from, 'heading', HEADING_KEYS, {
      description: from.options?.description ?? '',
    }),
  render: (field) =>
    h(
      'div',
      { class: `form-section${field.options?.className ? ` ${field.options.className}` : ''}` },
      [
        h('h3', { class: 'form-section__title' }, field.label || 'Section'),
        field.options?.description
          ? h('p', { class: 'form-section__desc' }, field.options.description)
          : null,
      ]
    ),
  inspector: (ctx) =>
    h('div', { class: 'setting-group mb-3' }, [
      h(
        'label',
        { class: 'block text-sm text-gray-700 mb-1' },
        ctx.i18n.t('formBuilder.sectionDescription') || 'Description'
      ),
      h('textarea', {
        class: 'form-input w-full p-2 border border-gray-300 rounded-md',
        attrs: { rows: 2 },
        props: { value: ctx.field.options?.description ?? '' },
        on: {
          input: (e) => {
            const t = e.target;
            if (t instanceof HTMLTextAreaElement) {
              ctx.patchOptions({ description: t.value });
            }
          },
        },
      }),
    ]),
};

export const dividerDriver: FieldDriver = {
  type: 'divider',
  family: 'layout',
  nameKey: 'formBuilder.sectionDivider',
  palette: true,
  optionKeys: DIVIDER_KEYS,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.sectionDivider') || 'Divider',
    options: {},
    validation: { required: false },
  }),
  coerce: (from) => coerceField(from, 'divider', DIVIDER_KEYS),
  render: (field) =>
    h('hr', {
      class: `form-divider${field.options?.className ? ` ${field.options.className}` : ''}`,
      attrs: { 'aria-hidden': 'true' },
    }),
  inspector: () => null,
};
