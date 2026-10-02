import { createField, getDriver } from '../drivers';
import type { FormI18n } from '../drivers';
import type { FieldConfig, FieldType, FormConfig } from '../types';
import { emptyFormConfig } from '../io/adapters';

/** Thin form config store — SoT is FormConfig; no DOM parse. */
export class FormStore {
  private config: FormConfig;
  private readonly i18n: FormI18n;

  constructor(i18n: FormI18n, initial?: FormConfig) {
    this.i18n = i18n;
    this.config = initial ? structuredClone(initial) : emptyFormConfig();
  }

  getConfig(): FormConfig {
    return structuredClone(this.config);
  }

  setConfig(config: FormConfig): void {
    this.config = structuredClone(config);
  }

  getFields(): FieldConfig[] {
    return [...this.config.fields];
  }

  getField(id: string): FieldConfig | undefined {
    return this.config.fields.find((f) => f.id === id);
  }

  addField(type: FieldType, override?: Partial<FieldConfig>): FieldConfig {
    const base = createField(type, this.i18n, override?.id);
    const field: FieldConfig = override
      ? getDriver(type).coerce({ ...base, ...override, type, id: override.id ?? base.id })
      : base;
    this.config.fields.push(field);
    return field;
  }

  updateField(id: string, updates: Partial<FieldConfig>): boolean {
    const index = this.config.fields.findIndex((f) => f.id === id);
    if (index === -1) {
      return false;
    }
    const current = this.config.fields[index];
    if (current === undefined) {
      return false;
    }
    const nextType = updates.type ?? current.type;
    const merged: FieldConfig = {
      ...current,
      ...updates,
      id: current.id,
      type: nextType,
      options: updates.options ? { ...current.options, ...updates.options } : current.options,
      validation: updates.validation
        ? { ...current.validation, ...updates.validation }
        : current.validation,
    };
    this.config.fields[index] =
      updates.type && updates.type !== current.type ? getDriver(nextType).coerce(merged) : merged;
    return true;
  }

  setFieldType(id: string, type: FieldType): boolean {
    const field = this.getField(id);
    if (!field) {
      return false;
    }
    return this.updateField(id, { type });
  }

  removeField(id: string): boolean {
    const index = this.config.fields.findIndex((f) => f.id === id);
    if (index === -1) {
      return false;
    }
    this.config.fields.splice(index, 1);
    return true;
  }

  moveField(id: string, newPosition: number): boolean {
    const currentIndex = this.config.fields.findIndex((f) => f.id === id);
    if (currentIndex === -1 || newPosition < 0 || newPosition >= this.config.fields.length) {
      return false;
    }
    const [field] = this.config.fields.splice(currentIndex, 1);
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
    if (!field) {
      return false;
    }
    this.config.fields.splice(newPosition, 0, field);
    return true;
  }

  clearFields(): void {
    this.config.fields = [];
  }

  getMethod(): FormConfig['method'] {
    return this.config.method;
  }

  setMethod(method: FormConfig['method']): void {
    this.config.method = method;
  }

  getAction(): string {
    return this.config.action;
  }

  setAction(action: string): void {
    this.config.action = action;
  }
}
