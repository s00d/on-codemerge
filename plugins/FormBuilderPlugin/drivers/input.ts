import { h } from '@codemerge/sdk';
import type { FieldOptions, FieldType } from '../types';
import { coerceField } from './coerce';
import { wrappedInput } from './shared';
import type { FieldDriver, FormI18n } from './types';

const INPUT_TYPES = [
  'text',
  'email',
  'password',
  'number',
  'tel',
  'url',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
  'color',
  'range',
] as const satisfies readonly FieldType[];

export type NativeInputType = (typeof INPUT_TYPES)[number];

const OPTION_KEYS = [
  'name',
  'id',
  'placeholder',
  'value',
  'className',
  'readonly',
  'disabled',
  'min',
  'max',
  'step',
  'size',
  'maxlength',
  'minlength',
  'autocomplete',
] as const satisfies readonly (keyof FieldOptions)[];

const PALETTE: ReadonlySet<NativeInputType> = new Set(['text', 'email', 'number', 'date']);

function defaultPlaceholder(type: NativeInputType): string {
  const map: Record<NativeInputType, string> = {
    text: '',
    email: 'example@email.com',
    password: '••••••••',
    number: '0',
    tel: '+1…',
    url: 'https://',
    date: '',
    time: '',
    'datetime-local': '',
    month: '',
    week: '',
    color: '#000000',
    range: '',
  };
  return map[type];
}

function defaultAutocomplete(type: NativeInputType): FieldOptions['autocomplete'] | undefined {
  if (type === 'email') {
    return 'email';
  }
  if (type === 'tel') {
    return 'tel';
  }
  if (type === 'url') {
    return 'url';
  }
  if (type === 'password') {
    return 'current-password';
  }
  return undefined;
}

export function inputDriver(type: NativeInputType): FieldDriver {
  return {
    type,
    family: 'native-input',
    nameKey: `formBuilder.type.${type}`,
    palette: PALETTE.has(type),
    optionKeys: OPTION_KEYS,
    defaults: (i18n: FormI18n) => {
      const autocomplete = defaultAutocomplete(type);
      return {
        label: i18n.t('formBuilder.newField') || 'New field',
        options: {
          placeholder: defaultPlaceholder(type),
          ...(autocomplete ? { autocomplete } : {}),
          ...(type === 'range' ? { min: 0, max: 100, step: 1, value: '50' } : {}),
          ...(type === 'number' ? { step: 1 } : {}),
        },
        validation: { required: false },
      };
    },
    coerce: (from) => {
      const extras: Partial<FieldOptions> =
        type === 'range' && from.options?.min === undefined ? { min: 0, max: 100, step: 1 } : {};
      return coerceField(from, type, OPTION_KEYS, extras);
    },
    render: (field) => wrappedInput(field, type),
    inspector: (ctx) => {
      const opts = ctx.field.options ?? {};
      const rows = [
        h('div', { class: 'setting-group mb-3' }, [
          h(
            'label',
            { class: 'block text-sm text-gray-700 mb-1' },
            ctx.i18n.t('formBuilder.defaultValue') || 'Default value'
          ),
          h('input', {
            class: 'form-input w-full p-2 border border-gray-300 rounded-md',
            attrs: { type: type === 'password' ? 'text' : type },
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
        h('div', { class: 'setting-group mb-3' }, [
          h(
            'label',
            { class: 'block text-sm text-gray-700 mb-1' },
            ctx.i18n.t('formBuilder.placeholder') || 'Placeholder'
          ),
          h('input', {
            class: 'form-input w-full p-2 border border-gray-300 rounded-md',
            attrs: { type: 'text' },
            props: { value: opts.placeholder ?? '' },
            on: {
              input: (e) => {
                const t = e.target;
                if (t instanceof HTMLInputElement) {
                  ctx.patchOptions({ placeholder: t.value });
                }
              },
            },
          }),
        ]),
      ];
      if (type === 'number' || type === 'range' || type === 'date' || type === 'time') {
        rows.push(
          h('div', { class: 'setting-group mb-3 grid grid-cols-2 gap-2' }, [
            h('div', null, [
              h('label', { class: 'block text-sm text-gray-700 mb-1' }, 'Min'),
              h('input', {
                class: 'form-input w-full p-2 border border-gray-300 rounded-md',
                attrs: { type: type === 'number' || type === 'range' ? 'number' : type },
                props: { value: opts.min !== undefined ? String(opts.min) : '' },
                on: {
                  input: (e) => {
                    const t = e.target;
                    if (t instanceof HTMLInputElement) {
                      ctx.patchOptions({ min: t.value });
                    }
                  },
                },
              }),
            ]),
            h('div', null, [
              h('label', { class: 'block text-sm text-gray-700 mb-1' }, 'Max'),
              h('input', {
                class: 'form-input w-full p-2 border border-gray-300 rounded-md',
                attrs: { type: type === 'number' || type === 'range' ? 'number' : type },
                props: { value: opts.max !== undefined ? String(opts.max) : '' },
                on: {
                  input: (e) => {
                    const t = e.target;
                    if (t instanceof HTMLInputElement) {
                      ctx.patchOptions({ max: t.value });
                    }
                  },
                },
              }),
            ]),
          ])
        );
      }
      return h('div', null, rows);
    },
  };
}
