import type { FieldConfig, FieldOptions, FieldType, ValidationRules } from '../types';
import { ensureChoices, pickOptions } from './shared';

export function slimValidation(from: ValidationRules | undefined): ValidationRules {
  return {
    required: from?.required ?? false,
    ...(from?.pattern ? { pattern: from.pattern } : {}),
    ...(from?.minLength !== undefined ? { minLength: from.minLength } : {}),
    ...(from?.maxLength !== undefined ? { maxLength: from.maxLength } : {}),
    ...(from?.min !== undefined ? { min: from.min } : {}),
    ...(from?.max !== undefined ? { max: from.max } : {}),
    ...(from?.step !== undefined ? { step: from.step } : {}),
    ...(from?.numeric ? { numeric: true } : {}),
    ...(from?.alphanumeric ? { alphanumeric: true } : {}),
  };
}

export function coerceField(
  from: FieldConfig,
  type: FieldType,
  optionKeys: readonly (keyof FieldOptions)[],
  extras?: Partial<FieldOptions>
): FieldConfig {
  const picked = pickOptions(from.options, optionKeys);
  const name = from.options?.name ?? from.id;
  return {
    id: from.id,
    type,
    label: from.label || type,
    options: {
      name,
      ...picked,
      ...extras,
    },
    validation: slimValidation(from.validation),
  };
}

export function coerceWithChoices(
  from: FieldConfig,
  type: FieldType,
  optionKeys: readonly (keyof FieldOptions)[],
  extras?: Partial<FieldOptions>
): FieldConfig {
  const base = coerceField(from, type, optionKeys, extras);
  return {
    ...base,
    options: {
      ...base.options,
      options: ensureChoices(from.options?.options ?? base.options?.options),
    },
  };
}
