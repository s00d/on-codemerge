import type { ViewSpec } from '@codemerge/sdk';
import { h } from '@codemerge/sdk';
import { attrToHtmlValue } from '@ocm/wysiwyg/utils/attrJson';
import type { FieldConfig, FieldOptions } from '../types';

export function fieldName(field: FieldConfig): string {
  return field.options?.name ?? field.id;
}

export function wrapClass(field: FieldConfig): string {
  return `form-field${field.validation?.required ? ' required-field' : ''}`;
}

export function fieldCommonAttrs(
  field: FieldConfig
): Record<string, string | number | boolean | null | undefined> {
  const { options, validation } = field;
  return {
    placeholder: options?.placeholder,
    value: options?.value,
    class: options?.className,
    readonly: options?.readonly ? true : undefined,
    disabled: options?.disabled ? true : undefined,
    size: options?.size,
    maxlength: options?.maxlength,
    minlength: options?.minlength,
    min: options?.min,
    max: options?.max,
    step: options?.step,
    autocomplete: options?.autocomplete,
    required: validation?.required ? true : undefined,
    pattern: validation?.pattern,
    'data-validation': validation ? attrToHtmlValue(validation) : undefined,
  };
}

export function labelNode(field: FieldConfig): ViewSpec | null {
  return field.label ? h('label', { attrs: { for: field.id } }, field.label) : null;
}

export function wrappedInput(
  field: FieldConfig,
  inputType: string,
  extra: Record<string, string | number | boolean | null | undefined> = {}
): ViewSpec {
  return h('div', { class: wrapClass(field) }, [
    labelNode(field),
    h('input', {
      attrs: {
        type: inputType,
        id: field.id,
        name: fieldName(field),
        ...fieldCommonAttrs(field),
        ...extra,
      },
    }),
  ]);
}

export function pickOptions(
  from: FieldOptions | undefined,
  keys: readonly (keyof FieldOptions)[]
): FieldOptions {
  const src = from ?? {};
  const out: FieldOptions = {};
  for (const k of keys) {
    const v = src[k];
    if (v !== undefined) {
      Object.assign(out, { [k]: v });
    }
  }
  return out;
}

export function ensureChoices(options: readonly string[] | undefined): string[] {
  if (options && options.length > 0) {
    return [...options];
  }
  return ['Option 1', 'Option 2'];
}
