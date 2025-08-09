export interface FieldConfig {
  id: string;
  type: FieldType;
  label: string;
  options?: FieldOptions;
  validation?: ValidationRules;
  position?: number;
}

export type FieldType =
  | 'text' | 'textarea' | 'select' | 'checkbox' | 'radio'
  | 'button' | 'file' | 'date' | 'time' | 'range' | 'email'
  | 'password' | 'number' | 'tel' | 'url' | 'color'
  | 'datetime-local' | 'month' | 'week' | 'hidden' | 'image'
  | 'submit' | 'reset';

export interface FieldOptions {
  readonly name?: string;
  readonly id?: string;
  readonly placeholder?: string;
  readonly value?: string;
  readonly className?: string;
  readonly readonly?: boolean;
  readonly disabled?: boolean;
  readonly multiple?: boolean;
  readonly checked?: boolean;
  readonly min?: number | string;
  readonly max?: number | string;
  readonly step?: number;
  readonly rows?: number;
  readonly cols?: number;
  readonly accept?: string;
  readonly size?: number;
  readonly maxlength?: number;
  readonly minlength?: number;
  readonly src?: string;
  readonly alt?: string;
  readonly options?: readonly string[];
  readonly autocomplete?: 'on' | 'off' | 'name' | 'email' | 'tel' | 'url' | 'current-password' | 'new-password';
}

export interface ValidationRules {
  readonly required?: boolean;
  readonly pattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  email?: boolean;
  url?: boolean;
  numeric?: boolean;
  readonly alphanumeric?: boolean;
  readonly custom?: (value: string) => true | string;
}

export interface FormConfig {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  action: string;
  enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
  target?: '_blank' | '_self' | '_parent' | '_top';
  className?: string;
  fields: FieldConfig[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  config: FormConfig;
  category: 'contact' | 'survey' | 'registration' | 'payment' | 'custom';
}
