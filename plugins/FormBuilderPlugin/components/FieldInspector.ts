import { h, mount } from '@codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@codemerge/sdk';
import { allFieldTypes, isFieldType } from '../types';
import type { FieldConfig, FieldOptions, ValidationRules } from '../types';
import { DRIVERS, getDriver } from '../drivers';
import type { FormStore } from '../services/FormStore';

export type FieldInspectorHooks = {
  onChange: () => void;
  onRemove: (fieldId: string) => void;
  onClone: (fieldId: string) => void;
};

/** Field inspector — common frame + driver.inspector type block. */
export class FieldInspector {
  private readonly editor: EditorAPI;
  private readonly store: FormStore;
  private readonly hooks: FieldInspectorHooks;
  private mountHandle: MountHandle | null = null;

  constructor(editor: EditorAPI, store: FormStore, hooks: FieldInspectorHooks) {
    this.editor = editor;
    this.store = store;
    this.hooks = hooks;
  }

  private t(k: string): string {
    return this.editor.t(k) || k;
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
  }

  mountInto(host: HTMLElement, field: FieldConfig): void {
    this.mountHandle?.destroy();
    this.mountHandle = mount(host, this.view(field));
  }

  private patch(fieldId: string, updates: Partial<FieldConfig>): void {
    this.store.updateField(fieldId, updates);
    this.hooks.onChange();
  }

  private patchOptions(fieldId: string, patch: Partial<FieldOptions>): void {
    const field = this.store.getField(fieldId);
    if (!field) {
      return;
    }
    this.patch(fieldId, { options: { ...field.options, ...patch } });
  }

  private patchValidation(fieldId: string, patch: Partial<ValidationRules>): void {
    const field = this.store.getField(fieldId);
    if (!field) {
      return;
    }
    this.patch(fieldId, { validation: { ...field.validation, ...patch } });
  }

  private view(fieldIn: FieldConfig): ViewSpec {
    const field = this.store.getField(fieldIn.id) ?? fieldIn;
    const driver = getDriver(field.type);
    const opts = field.options ?? {};
    const validation = field.validation ?? {};

    const typeSelect = h('div', { class: 'setting-group mb-3' }, [
      h(
        'label',
        { class: 'block text-sm text-gray-700 mb-1' },
        this.t('formBuilder.fieldType') || 'Type'
      ),
      h(
        'select',
        {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          props: { value: field.type },
          on: {
            change: (e) => {
              const t = e.target;
              if (!(t instanceof HTMLSelectElement) || !isFieldType(t.value)) {
                return;
              }
              this.store.setFieldType(field.id, t.value);
              this.hooks.onChange();
            },
          },
        },
        ...allFieldTypes().map((type) => {
          const d = DRIVERS[type];
          const label = this.t(d.nameKey);
          return h(
            'option',
            { attrs: { value: type }, props: { selected: field.type === type } },
            label === d.nameKey ? type : label
          );
        })
      ),
    ]);

    const labelField = h('div', { class: 'setting-group mb-3' }, [
      h(
        'label',
        { class: 'block text-sm text-gray-700 mb-1' },
        this.t('formBuilder.label') || 'Label'
      ),
      h('input', {
        class: 'form-input w-full p-2 border border-gray-300 rounded-md',
        attrs: { type: 'text' },
        props: { value: field.label },
        on: {
          input: (e) => {
            const t = e.target;
            if (t instanceof HTMLInputElement) {
              this.patch(field.id, { label: t.value });
            }
          },
        },
      }),
    ]);

    const nameField = h('div', { class: 'setting-group mb-3' }, [
      h(
        'label',
        { class: 'block text-sm text-gray-700 mb-1' },
        this.t('formBuilder.name') || 'Name'
      ),
      h('input', {
        class: 'form-input w-full p-2 border border-gray-300 rounded-md',
        attrs: { type: 'text' },
        props: { value: opts.name ?? field.id },
        on: {
          input: (e) => {
            const t = e.target;
            if (t instanceof HTMLInputElement) {
              this.patchOptions(field.id, { name: t.value });
            }
          },
        },
      }),
    ]);

    const required = h('label', { class: 'flex cursor-pointer items-center gap-2 mb-3' }, [
      h('input', {
        class: 'form-checkbox',
        attrs: { type: 'checkbox' },
        props: { checked: !!validation.required },
        on: {
          change: (e) => {
            const t = e.target;
            if (t instanceof HTMLInputElement) {
              this.patchValidation(field.id, { required: t.checked });
            }
          },
        },
      }),
      this.t('formBuilder.required') || 'Required',
    ]);

    const pattern = h('div', { class: 'setting-group mb-3' }, [
      h(
        'label',
        { class: 'block text-sm text-gray-700 mb-1' },
        this.t('formBuilder.pattern') || 'Pattern'
      ),
      h('input', {
        class: 'form-input w-full p-2 border border-gray-300 rounded-md',
        attrs: { type: 'text', placeholder: '^[a-z]+$' },
        props: { value: validation.pattern ?? '' },
        on: {
          input: (e) => {
            const t = e.target;
            if (t instanceof HTMLInputElement) {
              this.patchValidation(field.id, { pattern: t.value || undefined });
            }
          },
        },
      }),
    ]);

    const lengths = h('div', { class: 'setting-group mb-3 grid grid-cols-2 gap-2' }, [
      h('div', null, [
        h('label', { class: 'block text-sm text-gray-700 mb-1' }, 'Min length'),
        h('input', {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          attrs: { type: 'number', min: '0' },
          props: { value: validation.minLength !== undefined ? String(validation.minLength) : '' },
          on: {
            input: (e) => {
              const t = e.target;
              if (t instanceof HTMLInputElement) {
                const n = t.value === '' ? undefined : Number(t.value);
                this.patchValidation(field.id, { minLength: n });
              }
            },
          },
        }),
      ]),
      h('div', null, [
        h('label', { class: 'block text-sm text-gray-700 mb-1' }, 'Max length'),
        h('input', {
          class: 'form-input w-full p-2 border border-gray-300 rounded-md',
          attrs: { type: 'number', min: '0' },
          props: { value: validation.maxLength !== undefined ? String(validation.maxLength) : '' },
          on: {
            input: (e) => {
              const t = e.target;
              if (t instanceof HTMLInputElement) {
                const n = t.value === '' ? undefined : Number(t.value);
                this.patchValidation(field.id, { maxLength: n });
              }
            },
          },
        }),
      ]),
    ]);

    const typeBlock = driver.inspector({
      field,
      i18n: this.editor,
      patchOptions: (patch) => {
        this.patchOptions(field.id, patch);
      },
    });

    const actions = h('div', { class: 'flex flex-wrap gap-2 mt-4' }, [
      h(
        'button',
        {
          class: 'ocm-popup__btn',
          attrs: { type: 'button' },
          on: {
            click: () => {
              this.hooks.onClone(field.id);
            },
          },
        },
        this.t('common.clone') || 'Clone'
      ),
      h(
        'button',
        {
          class: 'ocm-popup__btn ocm-popup__btn--danger',
          attrs: { type: 'button' },
          on: {
            click: () => {
              this.hooks.onRemove(field.id);
            },
          },
        },
        this.t('common.delete') || 'Delete'
      ),
    ]);

    return h(
      'div',
      { class: 'field-inspector' },
      driver.family === 'layout'
        ? [typeSelect, field.type === 'heading' ? labelField : null, typeBlock, actions]
        : [typeSelect, labelField, nameField, required, pattern, lengths, typeBlock, actions]
    );
  }
}
