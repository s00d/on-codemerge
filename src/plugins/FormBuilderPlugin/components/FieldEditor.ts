import { h, mount } from '@on-codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import type { FieldConfig, FieldType } from '../types';
import type { FormManager } from '../services/FormManager';

/** Field settings editor — ViewSpec + mountInto; presets via ui.popup. */
export class FieldEditor {
  private readonly editor: EditorAPI;
  private readonly formManager: FormManager;
  private readonly onUpdate: (fieldId: string, updates: Partial<FieldConfig>) => void;
  private readonly onRemove: (fieldId: string) => void;
  private readonly onClone: (fieldId: string) => void;
  private readonly onTypeChange?: (fieldId: string, newType: FieldType) => void;
  private readonly onOptionsChange?: (fieldId: string) => void;
  private mountHandle: MountHandle | null = null;

  constructor(
    onUpdate: (fieldId: string, updates: Partial<FieldConfig>) => void,
    onRemove: (fieldId: string) => void,
    onClone: (fieldId: string) => void,
    editor: EditorAPI,
    formManager: FormManager,
    onTypeChange?: (fieldId: string, newType: FieldType) => void,
    onOptionsChange?: (fieldId: string) => void
  ) {
    this.onUpdate = onUpdate;
    this.onRemove = onRemove;
    this.onClone = onClone;
    this.editor = editor;
    this.formManager = formManager;
    this.onTypeChange = onTypeChange;
    this.onOptionsChange = onOptionsChange;
  }

  private t(k: string): string {
    return this.editor.t(k) || k;
  }

  private opts(field: FieldConfig) {
    return this.formManager.getField(field.id)?.options ?? field.options ?? {};
  }

  private textField(
    label: string,
    value: string,
    onInput: (v: string) => void,
    type = 'text',
    placeholder = ''
  ): ViewSpec {
    return h('div', { class: 'setting-group mb-3' }, [
      h('label', { class: 'block text-sm text-gray-700 mb-1' }, label),
      h('input', {
        class:
          'form-input w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
        attrs: { type, placeholder: placeholder || label },
        props: { value },
        on: {
          input: (e) => {
            onInput((e.target as HTMLInputElement).value);
          },
        },
      }),
    ]);
  }

  private checkbox(label: string, checked: boolean, onChange: (v: boolean) => void): ViewSpec {
    return h('label', { class: 'flex cursor-pointer items-center gap-2' }, [
      h('input', {
        class: 'form-checkbox',
        attrs: { type: 'checkbox' },
        props: { checked },
        on: {
          change: (e) => {
            onChange((e.target as HTMLInputElement).checked);
          },
        },
      }),
      h('span', { class: 'text-sm text-ocm-text' }, label),
    ]);
  }

  private btn(label: string, onClick: () => void, className: string): ViewSpec {
    return h(
      'button',
      {
        class: className,
        attrs: { type: 'button' },
        on: { click: onClick },
      },
      label
    );
  }

  private fieldTypes(): { value: string; label: string }[] {
    return [
      { value: 'text', label: this.t('common.textInput') },
      { value: 'textarea', label: this.t('common.textArea') },
      { value: 'select', label: this.t('common.dropdown') },
      { value: 'checkbox', label: this.t('formBuilder.checkbox') },
      { value: 'radio', label: this.t('formBuilder.radioButton') },
      { value: 'button', label: this.t('common.button') },
      { value: 'file', label: this.t('common.fileUpload') },
      { value: 'date', label: this.t('common.date') },
      { value: 'time', label: this.t('common.time') },
      { value: 'range', label: this.t('common.range') },
      { value: 'email', label: this.t('common.email') },
      { value: 'password', label: this.t('common.password') },
      { value: 'number', label: this.t('common.number') },
      { value: 'tel', label: this.t('common.phone') },
      { value: 'url', label: this.t('common.url') },
      { value: 'color', label: this.t('common.color') },
      { value: 'datetime-local', label: this.t('common.dateTime') },
      { value: 'month', label: this.t('common.month') },
      { value: 'week', label: this.t('common.week') },
      { value: 'hidden', label: this.t('formBuilder.hiddenField') },
      { value: 'image', label: this.t('image.imageButton') },
    ];
  }

  private typeSpecific(field: FieldConfig): ViewSpec | null {
    const o = this.opts(field);
    const upd = (patch: Record<string, unknown>) => {
      this.onUpdate(field.id, { options: { ...o, ...patch } });
    };

    const kids: ViewSpec[] = [];
    switch (field.type) {
      case 'checkbox': {
        kids.push(
          this.textField(
            this.t('formBuilder.checkboxText'),
            (o.value ?? field.label) || '',
            (v) => {
              upd({ value: v });
            }
          ),
          this.checkbox(this.t('common.checkedByDefault'), Boolean(o.checked), (c) => {
            upd({ checked: c });
          })
        );
        break;
      }
      case 'number':
      case 'range': {
        kids.push(
          this.textField(
            this.t('common.minimumValue'),
            o.min === undefined ? '' : String(o.min),
            (v) => {
              upd({ min: v ? Number(v) : undefined });
            },
            'number'
          ),
          this.textField(
            this.t('common.maximumValue'),
            o.max === undefined ? '' : String(o.max),
            (v) => {
              upd({ max: v ? Number(v) : undefined });
            },
            'number'
          ),
          this.textField(
            this.t('common.stepValue'),
            o.step === undefined ? '' : String(o.step),
            (v) => {
              upd({ step: v ? Number(v) : undefined });
            },
            'number'
          )
        );
        break;
      }
      case 'textarea': {
        kids.push(
          this.textField(
            this.t('common.rows'),
            String(o.rows ?? 4),
            (v) => {
              upd({ rows: parseInt(v) || 4 });
            },
            'number'
          ),
          this.textField(
            this.t('common.columns'),
            String(o.cols ?? 50),
            (v) => {
              upd({ cols: parseInt(v) || 50 });
            },
            'number'
          )
        );
        break;
      }
      case 'file': {
        kids.push(
          this.textField(
            this.t('common.acceptedFileTypes'),
            o.accept ?? '',
            (v) => {
              upd({ accept: v });
            },
            'text',
            this.t('formBuilder.acceptedTypesExample')
          ),
          this.checkbox(this.t('common.allowMultipleFiles'), Boolean(o.multiple), (c) => {
            upd({ multiple: c });
          })
        );
        break;
      }
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'month':
      case 'week': {
        kids.push(
          this.textField(
            this.t('common.minimumDate'),
            o.min?.toString() ?? '',
            (v) => {
              upd({ min: v });
            },
            'date'
          ),
          this.textField(
            this.t('common.maximumDate'),
            o.max?.toString() ?? '',
            (v) => {
              upd({ max: v });
            },
            'date'
          )
        );
        break;
      }
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url': {
        kids.push(
          this.textField(
            this.t('common.maxLength'),
            o.maxlength === undefined ? '' : String(o.maxlength),
            (v) => {
              upd({ maxlength: v ? parseInt(v) : undefined });
            },
            'number'
          ),
          this.textField(this.t('common.autocomplete'), o.autocomplete ?? '', (v) => {
            upd({ autocomplete: v });
          })
        );
        break;
      }
      case 'color': {
        kids.push(
          this.textField(
            this.t('common.defaultColor'),
            o.value ?? '#000000',
            (v) => {
              upd({ value: v });
            },
            'color'
          )
        );
        break;
      }
      case 'image': {
        kids.push(
          this.textField(this.t('image.imageUrl'), o.src ?? '', (v) => {
            upd({ src: v });
          }),
          this.textField(this.t('common.altText'), o.alt ?? '', (v) => {
            upd({ alt: v });
          })
        );
        break;
      }
      case 'button':
      case 'hidden':
      case 'radio':
      case 'reset':
      case 'select':
      case 'submit':
      default: {
        return null;
      }
    }
    return h('div', { class: 'type-specific-options mb-3' }, [
      h(
        'div',
        { class: 'section-title text-sm font-medium mb-2' },
        this.t('common.typeSpecificOptions')
      ),
      ...kids,
    ]);
  }

  private moveOption(fieldId: string, from: number, to: number): void {
    const field = this.formManager.getField(fieldId);
    if (!field?.options?.options) {
      return;
    }
    const options = [...field.options.options];
    const [item] = options.splice(from, 1);
    if (item === undefined) {
      return;
    }
    options.splice(to, 0, item);
    this.onUpdate(fieldId, { options: { ...field.options, options } });
    this.onOptionsChange?.(fieldId);
  }

  private optionsList(field: FieldConfig): ViewSpec {
    const options = field.options?.options ?? [];
    const title =
      field.type === 'checkbox'
        ? this.t('formBuilder.checkboxOptions')
        : field.type === 'radio'
          ? this.t('formBuilder.radioOptions')
          : this.t('common.options');

    const rows: ViewSpec[] =
      options.length === 0
        ? [
            h(
              'div',
              { class: 'empty-state text-center py-3 text-gray-400 text-xs' },
              `📝 ${this.t('common.noOptions')}`
            ),
          ]
        : options.map((option, index) =>
            h('div', { class: 'option-item bg-white border border-gray-200 rounded p-2' }, [
              h('div', { class: 'flex items-center gap-2' }, [
                h(
                  'div',
                  {
                    class:
                      'option-number text-xs font-medium text-gray-700 bg-blue-100 text-blue-800 px-2 py-1 rounded min-w-[24px] text-center',
                  },
                  String(index + 1)
                ),
                h(
                  'div',
                  { class: 'text-xs text-gray-500 min-w-[40px]' },
                  field.type === 'checkbox' || field.type === 'radio'
                    ? this.t('common.text2')
                    : this.t('common.value2')
                ),
                h('input', {
                  class:
                    'flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500',
                  attrs: { type: 'text' },
                  props: { value: option },
                  on: {
                    input: (e) => {
                      const newOptions = [...options];
                      newOptions[index] = (e.target as HTMLInputElement).value;
                      this.onUpdate(field.id, {
                        options: { ...field.options, options: newOptions },
                      });
                      this.onOptionsChange?.(field.id);
                    },
                  },
                }),
                h('div', { class: 'flex gap-1' }, [
                  index > 0
                    ? this.btn(
                        '↑',
                        () => {
                          this.moveOption(field.id, index, index - 1);
                        },
                        'px-1.5 py-0.5 text-xs bg-gray-100 rounded'
                      )
                    : null,
                  index < options.length - 1
                    ? this.btn(
                        '↓',
                        () => {
                          this.moveOption(field.id, index, index + 1);
                        },
                        'px-1.5 py-0.5 text-xs bg-gray-100 rounded'
                      )
                    : null,
                  this.btn(
                    '×',
                    () => {
                      this.onUpdate(field.id, {
                        options: {
                          ...field.options,
                          options: options.filter((_, i) => i !== index),
                        },
                      });
                      this.onOptionsChange?.(field.id);
                    },
                    'px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded'
                  ),
                ]),
              ]),
            ])
          );

    return h('div', { class: 'options-list mb-3 p-3 bg-gray-50 rounded border border-gray-200' }, [
      h('div', { class: 'section-title text-sm font-medium mb-2 text-gray-700' }, title),
      h('div', { class: 'options-container space-y-1' }, ...rows),
      h('div', { class: 'action-buttons mt-2 space-y-1' }, [
        this.btn(
          field.type === 'checkbox'
            ? `➕ ${this.t('formBuilder.addCheckbox')}`
            : field.type === 'radio'
              ? `➕ ${this.t('formBuilder.addRadio')}`
              : `➕ ${this.t('common.addOption')}`,
          () => {
            this.onUpdate(field.id, {
              options: { ...field.options, options: [...options, `Option ${options.length + 1}`] },
            });
            this.onOptionsChange?.(field.id);
          },
          'w-full px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600'
        ),
        field.type === 'select' || field.type === 'radio'
          ? this.btn(
              `📋 ${this.t('common.usePreset')}`,
              () => {
                this.showPresetOptions(field);
              },
              'w-full px-2 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300'
            )
          : null,
      ]),
    ]);
  }

  private showPresetOptions(field: FieldConfig): void {
    const presets: Record<string, string[]> = {
      countries: [
        'United States',
        'Canada',
        'United Kingdom',
        'Germany',
        'France',
        'Japan',
        'Australia',
        'Brazil',
        'India',
        'China',
      ],
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      colors: [
        'Red',
        'Blue',
        'Green',
        'Yellow',
        'Orange',
        'Purple',
        'Black',
        'White',
        'Gray',
        'Pink',
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      'age-groups': ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'],
      genders: [this.t('common.male'), this.t('common.female'), this.t('common.other')],
      'yes-no': [this.t('common.yes'), this.t('common.no')],
    };

    const apply = (values: string[]) => {
      this.onUpdate(field.id, { options: { ...field.options, options: values } });
      this.editor.notify?.(
        `${this.t('common.applied')} ${values.length} ${this.t('common.options2')}`
      );
      this.onOptionsChange?.(field.id);
      this.editor.ui.popup.hide();
    };

    this.editor.ui.popup.open({
      title: this.t('common.selectPresetOptions'),
      className: 'field-preset-popup',
      closeOnClickOutside: true,
      buttons: [{ label: this.t('common.cancel'), variant: 'secondary', onClick: () => {} }],
      items: [
        {
          type: 'view',
          id: 'presets',
          view: () =>
            h(
              'div',
              { class: 'grid grid-cols-1 md:grid-cols-2 gap-4 p-2' },
              ...Object.entries(presets).map(([key, values]) =>
                h(
                  'button',
                  {
                    class:
                      'preset-card text-left border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md bg-white',
                    attrs: { type: 'button' },
                    on: {
                      click: () => {
                        apply(values);
                      },
                    },
                  },
                  [
                    h(
                      'h4',
                      { class: 'font-semibold text-gray-800 mb-2' },
                      this.t(key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '))
                    ),
                    h(
                      'p',
                      { class: 'text-sm text-gray-600 mb-2' },
                      `${values.length} ${this.t('common.options2')}`
                    ),
                    h(
                      'div',
                      { class: 'text-xs text-gray-500 bg-gray-50 p-2 rounded border' },
                      values.slice(0, 3).join(', ') + (values.length > 3 ? '...' : '')
                    ),
                  ]
                )
              )
            ),
        },
      ],
    });
  }

  view(field: FieldConfig): ViewSpec {
    const o = this.opts(field);
    const typeSpecific = this.typeSpecific(field);
    return h(
      'div',
      { class: 'field-editor-container mb-4 p-4 border border-gray-200 rounded bg-gray-50' },
      [
        h('div', { class: 'field-header flex justify-between items-center mb-3' }, [
          h(
            'div',
            { class: 'field-title text-lg font-semibold' },
            field.label || this.t('formBuilder.untitledField')
          ),
          h('div', { class: 'field-actions flex gap-2' }, [
            this.btn(
              this.t('common.copy'),
              () => {
                this.onClone(field.id);
              },
              'ocm-popup__btn ocm-popup__btn--secondary'
            ),
            this.btn(
              this.t('common.remove'),
              () => {
                this.onRemove(field.id);
              },
              'ocm-popup__btn ocm-popup__btn--danger'
            ),
          ]),
        ]),
        h('div', { class: 'main-settings mb-4' }, [
          h(
            'div',
            { class: 'section-title text-md font-medium mb-2' },
            this.t('common.mainSettings')
          ),
          h('div', { class: 'setting-group mb-3' }, [
            h('label', { class: 'block text-sm mb-1' }, this.t('formBuilder.fieldType')),
            h(
              'select',
              {
                class: 'form-select w-full p-2 border border-gray-300 rounded-md',
                props: { value: field.type },
                on: {
                  change: (e) => {
                    const newType = (e.target as HTMLSelectElement).value as FieldType;
                    this.onUpdate(field.id, { type: newType });
                    this.onTypeChange?.(field.id, newType);
                  },
                },
              },
              ...this.fieldTypes().map((opt) =>
                h(
                  'option',
                  { attrs: { value: opt.value }, props: { selected: opt.value === field.type } },
                  opt.label
                )
              )
            ),
          ]),
          this.textField(this.t('formBuilder.fieldLabel'), field.label || '', (v) => {
            this.onUpdate(field.id, { label: v });
          }),
          this.textField(this.t('common.placeholder'), o.placeholder ?? '', (v) => {
            this.onUpdate(field.id, { options: { ...o, placeholder: v } });
          }),
        ]),
        h('div', { class: 'options-settings mb-4' }, [
          h(
            'div',
            { class: 'section-title text-md font-medium mb-2' },
            this.t('common.additionalOptions')
          ),
          this.textField(this.t('formBuilder.fieldNameName'), o.name ?? '', (v) => {
            this.onUpdate(field.id, { options: { ...o, name: v } });
          }),
          this.textField(this.t('formBuilder.fieldId'), o.id ?? '', (v) => {
            this.onUpdate(field.id, { options: { ...o, id: v } });
          }),
          this.textField(this.t('common.cssClass'), o.className ?? '', (v) => {
            this.onUpdate(field.id, { options: { ...o, className: v } });
          }),
          h('div', { class: 'checkboxes-group flex flex-wrap gap-4 mb-3' }, [
            this.checkbox(this.t('common.readOnly'), Boolean(o.readonly), (c) => {
              this.onUpdate(field.id, { options: { ...o, readonly: c } });
            }),
            this.checkbox(this.t('common.disabled'), Boolean(o.disabled), (c) => {
              this.onUpdate(field.id, { options: { ...o, disabled: c } });
            }),
            this.checkbox(this.t('common.multipleSelection'), Boolean(o.multiple), (c) => {
              this.onUpdate(field.id, { options: { ...o, multiple: c } });
            }),
          ]),
          typeSpecific,
          field.type === 'select' || field.type === 'radio' ? this.optionsList(field) : null,
        ]),
        h('div', { class: 'validation-settings mb-4' }, [
          h(
            'div',
            { class: 'section-title text-md font-medium mb-2' },
            this.t('common.validation')
          ),
          this.checkbox(
            this.t('formBuilder.requiredField'),
            Boolean(field.validation?.required),
            (c) => {
              this.onUpdate(field.id, { validation: { ...field.validation, required: c } });
            }
          ),
          this.textField(
            this.t('common.regularExpression'),
            field.validation?.pattern ?? '',
            (v) => {
              this.onUpdate(field.id, { validation: { ...field.validation, pattern: v } });
            }
          ),
          this.textField(
            this.t('common.minimumLength'),
            field.validation?.minLength?.toString() ?? '',
            (v) => {
              this.onUpdate(field.id, {
                validation: { ...field.validation, minLength: parseInt(v) || undefined },
              });
            },
            'number'
          ),
          this.textField(
            this.t('common.maximumLength'),
            field.validation?.maxLength?.toString() ?? '',
            (v) => {
              this.onUpdate(field.id, {
                validation: { ...field.validation, maxLength: parseInt(v) || undefined },
              });
            },
            'number'
          ),
        ]),
      ]
    );
  }

  fieldView(field: FieldConfig): ViewSpec {
    return this.view(field);
  }

  mountInto(host: HTMLElement, field: FieldConfig): void {
    this.mountHandle?.destroy();
    this.mountHandle = mount(host, this.view(field));
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
  }
}
