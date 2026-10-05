import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';

import type { FieldOptions } from '../types';
import { coerceWithChoices } from './coerce';
import { ensureChoices, fieldCommonAttrs, fieldName, labelNode, wrapClass } from './shared';
import type { FieldDriver, FieldInspectorCtx, FormI18n } from './types';

const SELECT_KEYS = [
  'name',
  'id',
  'placeholder',
  'value',
  'className',
  'disabled',
  'multiple',
  'options',
] as const satisfies readonly (keyof FieldOptions)[];

const RADIO_KEYS = [
  'name',
  'id',
  'value',
  'className',
  'disabled',
  'options',
] as const satisfies readonly (keyof FieldOptions)[];

/** One-option-per-line editor for select/radio. */
export function choiceListEditor(ctx: FieldInspectorCtx): ViewSpec {
  const choices = ensureChoices(ctx.field.options?.options);
  return h('div', { class: 'setting-group mb-3' }, [
    h(
      'label',
      { class: 'block text-sm text-gray-700 mb-1' },
      ctx.i18n.t('formBuilder.options') || 'Options (one per line)'
    ),
    h('textarea', {
      class: 'form-input w-full p-2 border border-gray-300 rounded-md font-mono text-sm',
      attrs: { rows: Math.max(4, choices.length + 1) },
      props: { value: choices.join('\n') },
      on: {
        change: (e) => {
          const t = e.target;
          if (!(t instanceof HTMLTextAreaElement)) {
            return;
          }
          const next = t.value
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
          ctx.patchOptions({ options: next.length > 0 ? next : ['Option 1'] });
        },
      },
    }),
  ]);
}

export const selectDriver: FieldDriver = {
  type: 'select',
  family: 'select',
  nameKey: 'formBuilder.type.select',
  palette: true,
  optionKeys: SELECT_KEYS,
  supportsChoices: true,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.newField') || 'New field',
    options: { options: ['Option 1', 'Option 2'], value: 'Option 1' },
    validation: { required: false },
  }),
  coerce: (from) => coerceWithChoices(from, 'select', SELECT_KEYS),
  render: (field) => {
    const { value: selectedValue, ...selectAttrs } = fieldCommonAttrs(field);
    return h('div', { class: wrapClass(field) }, [
      labelNode(field),
      h(
        'select',
        {
          attrs: {
            id: field.id,
            name: fieldName(field),
            multiple: field.options?.multiple ? true : undefined,
            ...selectAttrs,
          },
          props: { value: typeof selectedValue === 'string' ? selectedValue : '' },
        },
        ...(field.options?.options ?? []).map((opt) =>
          h(
            'option',
            {
              attrs: { value: opt },
              props: { selected: selectedValue === opt },
            },
            opt
          )
        )
      ),
    ]);
  },
  inspector: (ctx) => {
    const opts = ctx.field.options ?? {};
    return h('div', null, [
      choiceListEditor(ctx),
      h('div', { class: 'setting-group mb-3' }, [
        h(
          'label',
          { class: 'block text-sm text-gray-700 mb-1' },
          ctx.i18n.t('formBuilder.defaultValue') || 'Default value'
        ),
        h(
          'select',
          {
            class: 'form-input w-full p-2 border border-gray-300 rounded-md',
            props: { value: opts.value ?? '' },
            on: {
              change: (e) => {
                const t = e.target;
                if (t instanceof HTMLSelectElement) {
                  ctx.patchOptions({ value: t.value });
                }
              },
            },
          },
          ...(opts.options ?? []).map((opt) =>
            h('option', { attrs: { value: opt }, props: { selected: opts.value === opt } }, opt)
          )
        ),
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
        'Multiple',
      ]),
    ]);
  },
};

export const radioDriver: FieldDriver = {
  type: 'radio',
  family: 'radio',
  nameKey: 'formBuilder.type.radio',
  palette: true,
  optionKeys: RADIO_KEYS,
  supportsChoices: true,
  defaults: (i18n: FormI18n) => ({
    label: i18n.t('formBuilder.newField') || 'New field',
    options: { options: ['Option 1', 'Option 2'], value: 'Option 1' },
    validation: { required: false },
  }),
  coerce: (from) => coerceWithChoices(from, 'radio', RADIO_KEYS),
  render: (field) => {
    const { value: _selected, ...radioAttrs } = fieldCommonAttrs(field);
    void _selected;
    return h('div', { class: wrapClass(field) }, [
      field.label ? h('div', { class: 'form-field__legend' }, field.label) : null,
      ...(field.options?.options ?? []).map((option, index) => {
        const radioId = `${field.id}_${index}`;
        return h('div', { class: 'checkbox-container' }, [
          h('input', {
            attrs: {
              ...radioAttrs,
              type: 'radio',
              id: radioId,
              name: fieldName(field),
              value: option,
              checked: field.options?.value === option ? true : undefined,
            },
          }),
          h('label', { attrs: { for: radioId } }, option),
        ]);
      }),
    ]);
  },
  inspector: (ctx) => {
    const opts = ctx.field.options ?? {};
    return h('div', null, [
      choiceListEditor(ctx),
      h('div', { class: 'setting-group mb-3' }, [
        h(
          'label',
          { class: 'block text-sm text-gray-700 mb-1' },
          ctx.i18n.t('formBuilder.defaultValue') || 'Default value'
        ),
        h(
          'select',
          {
            class: 'form-input w-full p-2 border border-gray-300 rounded-md',
            props: { value: opts.value ?? '' },
            on: {
              change: (e) => {
                const t = e.target;
                if (t instanceof HTMLSelectElement) {
                  ctx.patchOptions({ value: t.value });
                }
              },
            },
          },
          ...(opts.options ?? []).map((opt) =>
            h('option', { attrs: { value: opt }, props: { selected: opts.value === opt } }, opt)
          )
        ),
      ]),
    ]);
  },
};
