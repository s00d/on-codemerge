import type { ViewSpec } from '@codemerge/sdk';
import type { FieldConfig, FieldOptions, FieldType, ValidationRules } from '../types';

export type FieldFamily =
  | 'layout'
  | 'native-input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'button'
  | 'hidden'
  | 'image';

/** i18n surface for form labels (EditorAPI or publish stub). */
export type FormI18n = { t: (key: string) => string };

export type FieldInspectorCtx = {
  field: FieldConfig;
  i18n: FormI18n;
  patchOptions: (patch: Partial<FieldOptions>) => void;
};

export type FieldDriver = {
  readonly type: FieldType;
  readonly family: FieldFamily;
  readonly nameKey: string;
  readonly palette: boolean;
  readonly optionKeys: readonly (keyof FieldOptions)[];
  readonly supportsChoices?: boolean;
  defaults: (i18n: FormI18n) => Pick<FieldConfig, 'label' | 'options' | 'validation'>;
  coerce: (from: FieldConfig) => FieldConfig;
  render: (field: FieldConfig) => ViewSpec;
  inspector: (ctx: FieldInspectorCtx) => ViewSpec | null;
};

export type FieldDefaults = {
  label: string;
  options: FieldOptions;
  validation: ValidationRules;
};
