import { PopupController, foreign, h, mount } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import type { FieldConfig, FieldType, FormConfig } from '../types';
import { parseFormHttpMethod } from '../types';
import { FormManager } from '../services/FormManager';
import { FieldEditor } from './FieldEditor';
import { FormPreview } from './FormPreview';
import { TemplatesModal } from './TemplatesModal';

/** Form builder — ViewSpec chrome; FieldEditor/FormPreview via mountInto. */
export class FormBuilderModal {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;
  private readonly formManager: FormManager;
  private fieldEditor: FieldEditor | null = null;
  private formPreview: FormPreview | null = null;
  private callback: ((formConfig: FormConfig) => void) | null = null;

  private selectedFieldId: string | null = null;
  private previewContainer: HTMLElement | null = null;
  private fieldsListContainer: HTMLElement | null = null;
  private fieldEditorContainer: HTMLElement | null = null;
  private fieldsListMount: MountHandle | null = null;
  private settingsMount: MountHandle | null = null;
  private methodSelect: HTMLSelectElement | null = null;
  private urlInput: HTMLInputElement | null = null;
  private isEditMode = false;
  private readonly templatesModal: TemplatesModal | null = null;
  private dragStartIndex: number | null = null;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.formManager = new FormManager(editor);
    this.templatesModal = new TemplatesModal(editor, scope);
  }

  private t(k: string): string {
    return this.editor.t(k) || k;
  }

  private settingsView(): ViewSpec {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
    return h('div', { class: 'form-settings-inner' }, [
      h('div', { class: 'setting-group setting-group--method' }, [
        h('label', null, this.t('formBuilder.method')),
        h(
          'select',
          {
            class: 'form-settings-control',
            ref: 'methodSelect',
            props: { value: this.formManager.getFormMethod() },
            on: {
              change: (e) => {
                const t = e.target;
                if (!(t instanceof HTMLSelectElement)) {
                  return;
                }
                this.methodSelect = t;
                this.formManager.updateFormMethod(parseFormHttpMethod(t.value));
              },
            },
          },
          ...methods.map((m) =>
            h(
              'option',
              {
                attrs: { value: m },
                props: { selected: this.formManager.getFormMethod() === m },
              },
              m
            )
          )
        ),
      ]),
      h('div', { class: 'setting-group setting-group--action' }, [
        h('label', null, this.t('formBuilder.actionUrl')),
        h('input', {
          class: 'form-settings-control',
          attrs: {
            type: 'text',
            id: 'form-action-url',
            placeholder: this.t('formBuilder.enterFormActionUrl'),
          },
          ref: 'urlInput',
          props: { value: this.formManager.getFormAction() || '' },
          on: {
            input: (e) => {
              const t = e.target;
              if (!(t instanceof HTMLInputElement)) {
                return;
              }
              this.urlInput = t;
              this.formManager.updateFormAction(t.value);
            },
          },
        }),
      ]),
    ]);
  }

  private fieldsListView(): ViewSpec {
    const fields = this.formManager.getFields();
    if (fields.length === 0) {
      return h('div', { class: 'no-fields' }, this.t('formBuilder.noFieldsAddedYet'));
    }
    return h(
      'div',
      { class: 'fields-list-inner' },
      ...fields.map((field, index) =>
        h(
          'div',
          {
            class: `field-item${this.selectedFieldId === field.id ? ' selected' : ''}`,
            attrs: { draggable: true },
            on: {
              dragstart: (e) => {
                this.handleDragStart(e, index);
              },
              dragover: (e) => {
                this.handleDragOver(e, index);
              },
              drop: (e) => {
                this.handleDrop(e, index);
              },
              click: () => {
                this.selectField(field.id);
              },
            },
          },
          [
            h('div', { class: 'field-title' }, field.label || this.t('formBuilder.untitledField')),
            h('div', { class: 'field-type' }, field.type),
            h('div', { class: 'field-actions' }, [
              h(
                'button',
                {
                  class: 'field-action-button',
                  attrs: { type: 'button', disabled: index === 0 ? true : undefined },
                  on: {
                    click: (e) => {
                      e.stopPropagation();
                      this.moveField(field.id, index - 1);
                    },
                  },
                },
                '↑'
              ),
              h(
                'button',
                {
                  class: 'field-action-button',
                  attrs: {
                    type: 'button',
                    disabled: index === fields.length - 1 ? true : undefined,
                  },
                  on: {
                    click: (e) => {
                      e.stopPropagation();
                      this.moveField(field.id, index + 1);
                    },
                  },
                },
                '↓'
              ),
              h(
                'button',
                {
                  class: 'field-action-button',
                  attrs: { type: 'button' },
                  on: {
                    click: (e) => {
                      e.stopPropagation();
                      this.removeField(field.id);
                    },
                  },
                },
                '×'
              ),
            ]),
          ]
        )
      )
    );
  }

  private builderView(): ViewSpec {
    return h('div', { class: 'form-builder-modal-content' }, [
      h('div', { class: 'form-builder-toolbar' }, [
        foreign((host, scope) => {
          host.className = 'form-settings-panel';
          this.settingsMount?.destroy();
          this.settingsMount = mount(host, this.settingsView());
          const refs = this.settingsMount.refs;
          // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
          this.methodSelect =
            refs.methodSelect instanceof HTMLSelectElement ? refs.methodSelect : null;
          this.urlInput = refs.urlInput instanceof HTMLInputElement ? refs.urlInput : null;
          scope.disposable(() => {
            this.settingsMount?.destroy();
            this.settingsMount = null;
            this.methodSelect = null;
            this.urlInput = null;
          });
        }),
        h(
          'button',
          {
            class: 'ocm-popup__btn form-builder-templates-btn',
            attrs: { type: 'button' },
            on: {
              click: () => {
                this.openTemplatesModal();
              },
            },
          },
          this.t('common.templates')
        ),
      ]),
      h('div', { class: 'form-builder-main' }, [
        foreign((host, scope) => {
          host.className = 'fields-panel';
          const shell = mount(
            host,
            h('div', { class: 'fields-panel-inner' }, [
              h('div', { class: 'fields-header' }, [
                h('div', { class: 'fields-title' }, this.t('formBuilder.formFields')),
                h(
                  'button',
                  {
                    class: 'add-field-button',
                    attrs: { type: 'button' },
                    on: {
                      click: () => {
                        this.addField();
                      },
                    },
                  },
                  '+'
                ),
              ]),
              h('div', { class: 'fields-list', ref: 'fieldsList' }),
            ])
          );
          this.fieldsListContainer = shell.refs.fieldsList ?? null;
          this.renderFieldsListWithoutPreview();
          scope.own(shell);
          scope.disposable(() => {
            this.fieldsListMount?.destroy();
            this.fieldsListMount = null;
            this.fieldsListContainer = null;
          });
        }),
        foreign((host, scope) => {
          host.className = 'field-editor-panel';
          const shell = mount(
            host,
            h('div', { class: 'field-editor-panel-inner' }, [
              h('div', { class: 'editor-title' }, this.t('formBuilder.fieldEditor')),
              h('div', { class: 'field-editor-content', ref: 'fieldEditor' }),
            ])
          );
          this.fieldEditorContainer = shell.refs.fieldEditor ?? null;
          this.fieldEditor ??= new FieldEditor(
            (fieldId, updates) => {
              this.updateField(fieldId, updates);
            },
            (fieldId) => {
              this.removeField(fieldId);
            },
            (fieldId) => {
              this.cloneField(fieldId);
            },
            this.editor,
            this.formManager,
            (fieldId, newType) => {
              this.onFieldTypeChange(fieldId, newType);
            },
            (fieldId) => {
              this.onOptionsChange(fieldId);
            }
          );
          this.renderFieldEditor();
          scope.own(shell);
          scope.disposable(() => {
            this.fieldEditor?.destroy();
            this.fieldEditorContainer = null;
          });
        }),
        foreign((host, scope) => {
          host.className = 'preview-panel';
          const shell = mount(
            host,
            h('div', { class: 'preview-panel-inner' }, [
              h('div', { class: 'preview-title' }, this.t('math.formPreview')),
              h('div', { class: 'preview-content', ref: 'preview' }),
            ])
          );
          this.previewContainer = shell.refs.preview ?? null;
          // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
          this.formPreview = this.previewContainer
            ? new FormPreview(this.previewContainer, this.editor)
            : null;
          this.updatePreview();
          scope.own(shell);
          scope.disposable(() => {
            this.formPreview?.destroy();
            this.previewContainer = null;
            this.formPreview = null;
          });
        }),
      ]),
    ]);
  }

  private openBuilder(title: string, saveLabel: string): void {
    this.popups.open({
      title: this.t(title),
      className: 'form-builder-modal',
      size: 'lg',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {
            this.popups.close();
          },
        },
        {
          label: this.t(saveLabel),
          variant: 'primary',
          onClick: () => {
            this.saveForm();
          },
        },
      ],
      items: [
        {
          type: 'view',
          id: 'form-builder-content',
          view: () => this.builderView(),
        },
      ],
    });
  }

  private renderFieldsList(): void {
    this.renderFieldsListWithoutPreview();
    this.updatePreview();
  }

  private renderFieldsListWithoutPreview(): void {
    if (!this.fieldsListContainer) {
      return;
    }
    this.fieldsListMount?.destroy();
    this.fieldsListMount = mount(this.fieldsListContainer, this.fieldsListView());
  }

  private selectField(fieldId: string): void {
    this.selectedFieldId = fieldId;
    this.renderFieldsList();
    this.renderFieldEditor();
  }

  private renderFieldEditor(): void {
    if (!this.fieldEditorContainer || !this.fieldEditor) {
      return;
    }
    this.fieldEditorContainer.replaceChildren();

    if (this.selectedFieldId) {
      const field = this.formManager.getField(this.selectedFieldId);
      if (field) {
        this.fieldEditor.mountInto(this.fieldEditorContainer, field);
        return;
      }
    }
    mount(
      this.fieldEditorContainer,
      h('div', { class: 'no-field-message' }, this.t('formBuilder.selectAFieldToEdit'))
    );
  }

  private updateFieldEditorTitle(): void {
    if (!this.fieldEditorContainer || !this.selectedFieldId) {
      return;
    }
    const field = this.formManager.getField(this.selectedFieldId);
    if (!field) {
      return;
    }
    const titleElement = this.fieldEditorContainer.querySelector('.field-title');
    if (titleElement) {
      titleElement.replaceChildren(new Text(field.label || this.t('formBuilder.untitledField')));
    }
  }

  private addField(type: FieldType = 'text'): void {
    this.formManager.addField(type);
    const fields = this.formManager.getFields();
    if (fields.length > 0) {
      this.selectedFieldId = fields.at(-1)!.id;
    }
    this.renderFieldsList();
    this.renderFieldEditor();
  }

  private updateField(fieldId: string, updates: Partial<FieldConfig>): void {
    this.formManager.updateField(fieldId, updates);
    this.renderFieldsListWithoutPreview();
    this.updateFieldEditorTitle();
    this.updatePreview();
  }

  private removeField(fieldId: string): void {
    if (!confirm(this.t('formBuilder.areYouSureYouWantToDeleteThisField'))) {
      return;
    }

    const fields = this.formManager.getFields();
    const currentIndex = fields.findIndex((f) => f.id === fieldId);
    this.formManager.removeField(fieldId);

    const remainingFields = this.formManager.getFields();
    if (remainingFields.length > 0) {
      if (this.selectedFieldId === fieldId) {
        this.selectedFieldId =
          currentIndex < remainingFields.length
            ? remainingFields[currentIndex].id
            : remainingFields.at(-1)!.id;
      }
    } else {
      this.selectedFieldId = null;
    }

    this.renderFieldsListWithoutPreview();
    this.renderFieldEditor();
    this.updatePreview();
  }

  private cloneField(fieldId: string): void {
    const field = this.formManager.getField(fieldId);
    if (!field) {
      return;
    }
    const clonedField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      label: `${field.label} (Copy)`,
    };
    this.formManager.addField(field.type, clonedField);
    this.selectedFieldId = clonedField.id;
    this.renderFieldsListWithoutPreview();
    this.renderFieldEditor();
    this.updatePreview();
  }

  private moveField(fieldId: string, newPosition: number): void {
    this.formManager.moveField(fieldId, newPosition);
    this.renderFieldsListWithoutPreview();
  }

  private updatePreview(): void {
    if (!this.previewContainer || !this.formPreview) {
      return;
    }
    const formConfig = this.formManager.getFormConfig();
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
    if (formConfig && formConfig.fields.length > 0) {
      this.formPreview.createPreview(formConfig);
    } else {
      this.formPreview.destroy();
      mount(this.previewContainer, h('p', { class: 'no-preview-message' }, 'No fields to preview'));
    }
  }

  private saveForm(): void {
    const formConfig = this.formManager.getFormConfig();
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
    if (!formConfig) {
      return;
    }

    if (this.isEditMode && !confirm(this.t('formBuilder.areYouSureYouWantToUpdateThisForm'))) {
      return;
    }

    this.callback?.(formConfig);
    this.popups.close();
  }

  private updateFormSettings(): void {
    if (this.methodSelect) {
      this.methodSelect.value = this.formManager.getFormMethod();
    }
    if (this.urlInput) {
      this.urlInput.value = this.formManager.getFormAction() || '';
    }
  }

  public show(
    callback: (formConfig: FormConfig) => void,
    editMode = false,
    existingFormElement: HTMLElement | null = null
  ): void {
    this.callback = callback;
    this.isEditMode = editMode;

    if (editMode && existingFormElement) {
      this.openBuilder('formBuilder.editForm', 'formBuilder.updateForm');
      this.formManager.loadForm(existingFormElement);
      this.updateFormSettings();
      this.renderFieldsListWithoutPreview();
      this.renderFieldEditor();
    } else {
      this.selectedFieldId = null;
      this.openBuilder('formBuilder.title', 'formBuilder.saveForm');
    }

    globalThis.setTimeout(() => this.urlInput?.focus(), 0);
    this.updatePreview();
  }

  public loadFormConfig(formConfig: FormConfig): void {
    this.formManager.loadFormConfig(formConfig);
    this.selectedFieldId = null;
    this.updateFormSettings();
    this.renderFieldsListWithoutPreview();
    this.renderFieldEditor();
    this.updatePreview();
  }

  private openTemplatesModal(): void {
    this.popups.close();
    this.templatesModal?.show((template) => {
      // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
      if (!template?.config) {
        return;
      }
      this.openBuilder(
        this.isEditMode ? 'formBuilder.editForm' : 'formBuilder.title',
        this.isEditMode ? 'formBuilder.updateForm' : 'formBuilder.saveForm'
      );
      this.loadFormConfig(template.config);
    });
  }

  private handleDragStart(e: DragEvent, index: number): void {
    this.dragStartIndex = index;
    e.dataTransfer?.setData('text/plain', String(index));
  }

  private handleDragOver(e: DragEvent, _index: number): void {
    e.preventDefault();
  }

  private handleDrop(e: DragEvent, index: number): void {
    e.preventDefault();
    if (this.dragStartIndex !== null && this.dragStartIndex !== index) {
      const fields = this.formManager.getFields();
      const field = fields[this.dragStartIndex];
      // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
      if (field) {
        this.formManager.moveField(field.id, index);
        this.renderFieldsListWithoutPreview();
      }
      this.dragStartIndex = null;
    }
  }

  private onFieldTypeChange(fieldId: string, newType: FieldType): void {
    const currentField = this.formManager.getField(fieldId);
    if (!currentField) {
      return;
    }

    const baseOptions: Record<string, unknown> = {
      name: currentField.options?.name ?? fieldId,
      placeholder: currentField.options?.placeholder ?? '',
      className: currentField.options?.className ?? '',
      readonly: currentField.options?.readonly ?? false,
      disabled: currentField.options?.disabled ?? false,
    };

    switch (newType) {
      case 'select':
      case 'radio': {
        baseOptions.options = currentField.options?.options ?? [];
        baseOptions.multiple =
          newType === 'select' ? (currentField.options?.multiple ?? false) : false;
        if (Array.isArray(baseOptions.options) && baseOptions.options.length === 0) {
          baseOptions.options = [
            newType === 'radio' ? this.t('formBuilder.newRadio') : this.t('common.option1'),
          ];
        }
        break;
      }
      case 'checkbox': {
        baseOptions.value =
          (currentField.options?.value ?? currentField.label) || this.t('formBuilder.newCheckbox');
        baseOptions.checked = currentField.options?.checked ?? false;
        break;
      }
      case 'number':
      case 'range': {
        baseOptions.min = currentField.options?.min ?? '';
        baseOptions.max = currentField.options?.max ?? '';
        baseOptions.step = currentField.options?.step ?? '';
        break;
      }
      case 'textarea': {
        baseOptions.rows = currentField.options?.rows ?? 3;
        baseOptions.cols = currentField.options?.cols ?? 50;
        break;
      }
      case 'file': {
        baseOptions.accept = currentField.options?.accept ?? '';
        baseOptions.multiple = currentField.options?.multiple ?? false;
        break;
      }
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'month':
      case 'week': {
        baseOptions.min = currentField.options?.min ?? '';
        baseOptions.max = currentField.options?.max ?? '';
        break;
      }
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url': {
        baseOptions.maxlength = currentField.options?.maxlength ?? '';
        baseOptions.minlength = currentField.options?.minlength ?? '';
        break;
      }
      case 'color': {
        baseOptions.value = currentField.options?.value ?? '#000000';
        break;
      }
      case 'image': {
        baseOptions.src = currentField.options?.src ?? '';
        baseOptions.alt = currentField.options?.alt ?? '';
        break;
      }
      case 'button':
      case 'hidden':
      case 'reset':
      case 'submit': {
        break;
      }
    }

    const updates: Partial<FieldConfig> = {
      type: newType,
      options: baseOptions,
    };

    if (currentField.validation) {
      const validation = { ...currentField.validation };
      if (newType !== 'email' && newType !== 'url') {
        delete validation.email;
        delete validation.url;
      }
      if (newType !== 'number' && newType !== 'range') {
        delete validation.numeric;
      }
      updates.validation = validation;
    }

    this.formManager.updateField(fieldId, updates);
    this.renderFieldEditor();
    this.updatePreview();
  }

  private onOptionsChange(_fieldId: string): void {
    this.renderFieldEditor();
    this.updatePreview();
  }
}
