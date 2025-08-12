import { PopupManager } from '../../../core/ui/PopupManager';
import type { HTMLEditor } from '../../../app';
import type { FieldConfig, FieldType, FormConfig } from '../types';
import { FormManager } from '../services/FormManager';
import { FieldEditor } from './FieldEditor';
import { FormPreview } from './FormPreview';
import {
  createButton,
  createContainer,
  createInputField,
  createLabel,
  createLineBreak,
  createSelectField,
} from '../../../utils/helpers';
import { TemplatesModal } from './TemplatesModal';

export class FormBuilderModal {
  private readonly editor: HTMLEditor;
  private popup: PopupManager | null = null;
  private formManager: FormManager;
  private fieldEditor: FieldEditor | null = null;
  private formPreview: FormPreview | null = null;
  private callback: ((formConfig: FormConfig) => void) | null = null;

  private selectedFieldId: string | null = null;
  private previewContainer: HTMLElement | null = null;
  private fieldsListContainer: HTMLElement | null = null;
  private fieldEditorContainer: HTMLElement | null = null;
  private isEditMode: boolean = false;
  private existingFormElement: HTMLElement | null = null;
  private templatesModal: TemplatesModal | null = null;

  constructor(editor: HTMLEditor) {
    this.editor = editor;
    this.formManager = new FormManager(editor);
    this.templatesModal = new TemplatesModal(editor);

    this.popup = new PopupManager(editor, {
      title: editor.t('Form Builder'),
      className: 'form-builder-modal',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => {
            this.popup?.hide();
            this.destroy();
          },
        },
        {
          label: editor.t('Save Form'),
          variant: 'primary',
          onClick: () => this.saveForm(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'form-builder-content',
          content: () => this.createContent(),
        },
      ],
    });

    // Перехватываем закрытие через крестик и Escape
    this.setupCloseHandlers();
  }

  private setupCloseHandlers(): void {
    // Обработчик Escape для закрытия модалки
    this.handleEscapeKey = (e: Event) => {
      if ((e as KeyboardEvent).key === 'Escape' && this.popup?.isOpen()) {
        this.popup.hide();
        this.destroy();
      }
    };
    this.editor.getDOMContext().addEventListener('keydown', this.handleEscapeKey);
  }

  private createContent(): HTMLElement {
    const container = createContainer('form-builder-modal-content');

    // --- Кнопка шаблонов ---
    const headerPanel = createContainer(
      'form-builder-header-panel flex justify-between items-center mb-2'
    );
    const title = createContainer('form-builder-title text-xl font-bold');
    title.textContent = this.isEditMode
      ? this.editor.t('Edit Form')
      : this.editor.t('Form Builder');
    const templatesButton = createButton(
      this.editor.t('Templates'),
      () => this.openTemplatesModal(),
      'secondary'
    );
    headerPanel.appendChild(title);
    headerPanel.appendChild(templatesButton);
    container.appendChild(headerPanel);

    // Настройки формы
    const formSettings = this.createFormSettings();
    container.appendChild(formSettings);

    // Основной контент
    const mainContent = createContainer('form-builder-main');

    // Панель полей
    const fieldsPanel = this.createFieldsPanel();
    mainContent.appendChild(fieldsPanel);

    // Панель редактирования поля
    const fieldEditorPanel = this.createFieldEditorPanel();
    mainContent.appendChild(fieldEditorPanel);

    container.appendChild(mainContent);

    // Предпросмотр под редактором в той же модалке
    const previewPanel = this.createPreviewPanel();
    container.appendChild(previewPanel);

    return container;
  }

  private createFormSettings(): HTMLElement {
    const settings = createContainer('form-settings-panel');

    const title = createContainer('settings-title');
    title.textContent = this.editor.t('Form Settings');
    settings.appendChild(title);

    // Метод формы
    const methodContainer = createContainer('setting-group');
    const methodLabel = createLabel(this.editor.t('Method:'));
    const methodSelect = createSelectField(
      [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
        { value: 'PATCH', label: 'PATCH' },
      ],
      this.formManager.getFormMethod(),
      (value) => {
        this.formManager.updateFormMethod(value as any);
      }
    );
    methodContainer.appendChild(methodLabel);
    methodContainer.appendChild(methodSelect);
    settings.appendChild(methodContainer);

    // URL формы
    const urlContainer = createContainer('setting-group');
    const urlLabel = createLabel(this.editor.t('Action URL:'));
    const urlInput = createInputField(
      'text',
      this.editor.t('Enter form action URL'),
      this.formManager.getFormAction(),
      (value) => {
        this.formManager.updateFormAction(value);
      }
    );
    urlInput.id = 'form-action-url';
    urlContainer.appendChild(urlLabel);
    urlContainer.appendChild(urlInput);
    settings.appendChild(urlContainer);

    return settings;
  }

  private createFieldsPanel(): HTMLElement {
    const panel = createContainer('fields-panel');

    const header = createContainer('fields-header');
    const title = createContainer('fields-title');
    title.textContent = this.editor.t('Form Fields');

    const addButton = createButton('+', () => this.addField(), 'primary');
    addButton.className = 'add-field-button';

    header.appendChild(title);
    header.appendChild(addButton);
    panel.appendChild(header);

    this.fieldsListContainer = createContainer('fields-list');
    panel.appendChild(this.fieldsListContainer);

    this.renderFieldsList();

    return panel;
  }

  private createFieldEditorPanel(): HTMLElement {
    const panel = createContainer('field-editor-panel');

    const title = createContainer('editor-title');
    title.textContent = this.editor.t('Field Editor');
    panel.appendChild(title);

    this.fieldEditorContainer = createContainer('field-editor-content');
    panel.appendChild(this.fieldEditorContainer);

    if (!this.fieldEditor) {
      this.fieldEditor = new FieldEditor(
        (fieldId, updates) => this.updateField(fieldId, updates),
        (fieldId) => this.removeField(fieldId),
        (fieldId) => this.cloneField(fieldId),
        this.editor,
        this.formManager,
        (fieldId, newType) => this.onFieldTypeChange(fieldId, newType),
        (fieldId) => this.onOptionsChange(fieldId)
      );
    }

    return panel;
  }

  private createPreviewPanel(): HTMLElement {
    const panel = createContainer('preview-panel');

    const title = createContainer('preview-title');
    title.textContent = this.editor.t('Form Preview');
    panel.appendChild(title);

    const previewContent = createContainer('preview-content');
    panel.appendChild(previewContent);

    if (!this.formPreview) {
      this.formPreview = new FormPreview(previewContent, this.editor);
    }

    // Сохраняем ссылку на контейнер предпросмотра
    this.previewContainer = previewContent;

    return panel;
  }

  private renderFieldsList(): void {
    if (!this.fieldsListContainer) return;

    this.fieldsListContainer.innerHTML = '';

    const fields = this.formManager.getFields();

    if (fields.length === 0) {
      const noFields = createContainer('no-fields');
      noFields.textContent = this.editor.t('No fields added yet');
      this.fieldsListContainer.appendChild(noFields);
      return;
    }

    fields.forEach((field, index) => {
      const fieldItem = createContainer('field-item');
      fieldItem.setAttribute('draggable', 'true');
      fieldItem.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
      fieldItem.addEventListener('dragover', (e) => this.handleDragOver(e, index));
      fieldItem.addEventListener('drop', (e) => this.handleDrop(e, index));

      if (this.selectedFieldId === field.id) {
        fieldItem.classList.add('selected');
      }

      const fieldTitle = createContainer('field-title');
      fieldTitle.textContent = field.label || this.editor.t('Untitled Field');

      const fieldType = createContainer('field-type');
      fieldType.textContent = field.type;

      const fieldActions = createContainer('field-actions');

      const upButton = createButton('↑', () => this.moveField(field.id, index - 1), 'secondary');
      upButton.className = 'field-action-button';
      upButton.disabled = index === 0;

      const downButton = createButton('↓', () => this.moveField(field.id, index + 1), 'secondary');
      downButton.className = 'field-action-button';
      downButton.disabled = index === fields.length - 1;

      const removeButton = createButton('×', () => this.removeField(field.id), 'danger');
      removeButton.className = 'field-action-button';

      fieldActions.appendChild(upButton);
      fieldActions.appendChild(downButton);
      fieldActions.appendChild(removeButton);

      fieldItem.appendChild(fieldTitle);
      fieldItem.appendChild(fieldType);
      fieldItem.appendChild(fieldActions);

      fieldItem.addEventListener('click', () => this.selectField(field.id));

      this.fieldsListContainer!.appendChild(fieldItem);
    });

    this.updatePreview();
  }

  private selectField(fieldId: string): void {
    this.selectedFieldId = fieldId;
    this.renderFieldsList();
    this.renderFieldEditor();
  }

  private renderFieldEditor(): void {
    if (!this.fieldEditorContainer || !this.fieldEditor) return;

    this.fieldEditorContainer.innerHTML = '';

    if (this.selectedFieldId) {
      const field = this.formManager.getField(this.selectedFieldId);
      if (field) {
        const fieldEditorElement = this.fieldEditor.createFieldEditor(field);
        this.fieldEditorContainer.appendChild(fieldEditorElement);
      }
    } else {
      const noFieldMessage = createContainer('no-field-message');
      noFieldMessage.textContent = this.editor.t('Select a field to edit');
      this.fieldEditorContainer.appendChild(noFieldMessage);
    }
  }

  private updateFieldEditorTitle(): void {
    if (!this.fieldEditorContainer || !this.selectedFieldId) return;

    const field = this.formManager.getField(this.selectedFieldId);
    if (!field) return;

    // Находим заголовок в редакторе поля и обновляем его
    const titleElement = this.fieldEditorContainer.querySelector('.field-title');
    if (titleElement) {
      titleElement.textContent = field.label || this.editor.t('Untitled Field');
    }
  }

  private addField(type: FieldType = 'text'): void {
    this.formManager.addField(type);

    // Получаем список полей и выбираем последнее добавленное
    const fields = this.formManager.getFields();
    if (fields.length > 0) {
      this.selectedFieldId = fields[fields.length - 1].id;
    }

    this.renderFieldsList();
    this.renderFieldEditor();
  }

  private renderFieldsListWithoutPreview(): void {
    if (!this.fieldsListContainer) return;

    this.fieldsListContainer.innerHTML = '';

    const fields = this.formManager.getFields();

    if (fields.length === 0) {
      const noFields = createContainer('no-fields');
      noFields.textContent = this.editor.t('No fields added yet');
      this.fieldsListContainer.appendChild(noFields);
      return;
    }

    fields.forEach((field, index) => {
      const fieldItem = createContainer('field-item');

      if (this.selectedFieldId === field.id) {
        fieldItem.classList.add('selected');
      }

      const fieldTitle = createContainer('field-title');
      fieldTitle.textContent = field.label || this.editor.t('Untitled Field');

      const fieldType = createContainer('field-type');
      fieldType.textContent = field.type;

      const fieldActions = createContainer('field-actions');

      const upButton = createButton('↑', () => this.moveField(field.id, index - 1), 'secondary');
      upButton.className = 'field-action-button';
      upButton.disabled = index === 0;

      const downButton = createButton('↓', () => this.moveField(field.id, index + 1), 'secondary');
      downButton.className = 'field-action-button';
      downButton.disabled = index === fields.length - 1;

      const removeButton = createButton('×', () => this.removeField(field.id), 'danger');
      removeButton.className = 'field-action-button';

      fieldActions.appendChild(upButton);
      fieldActions.appendChild(downButton);
      fieldActions.appendChild(removeButton);

      fieldItem.appendChild(fieldTitle);
      fieldItem.appendChild(fieldType);
      fieldItem.appendChild(fieldActions);

      fieldItem.addEventListener('click', () => this.selectField(field.id));

      this.fieldsListContainer!.appendChild(fieldItem);
    });

    // НЕ вызываем updatePreview() здесь
  }

  private updateField(fieldId: string, updates: Partial<FieldConfig>): void {
    this.formManager.updateField(fieldId, updates);
    this.renderFieldsListWithoutPreview();
    this.updateFieldEditorTitle();
    this.updatePreview();
  }

  private removeField(fieldId: string): void {
    if (confirm(this.editor.t('Are you sure you want to delete this field?'))) {
      const fields = this.formManager.getFields();
      const currentIndex = fields.findIndex((f) => f.id === fieldId);

      this.formManager.removeField(fieldId);

      // Выбираем подходящее поле после удаления
      const remainingFields = this.formManager.getFields();
      if (remainingFields.length > 0) {
        // Если удаляемое поле было выбрано, выбираем соседнее или последнее
        if (this.selectedFieldId === fieldId) {
          if (currentIndex < remainingFields.length) {
            // Выбираем поле на той же позиции
            this.selectedFieldId = remainingFields[currentIndex].id;
          } else {
            // Выбираем последнее поле
            this.selectedFieldId = remainingFields[remainingFields.length - 1].id;
          }
        }
      } else {
        // Если полей не осталось, сбрасываем выбор
        this.selectedFieldId = null;
      }

      this.renderFieldsListWithoutPreview();
      this.renderFieldEditor();
    }
  }

  private cloneField(fieldId: string): void {
    const field = this.formManager.getField(fieldId);
    if (field) {
      const clonedField = {
        ...field,
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: `${field.label} (Copy)`,
      };

      this.formManager.addField(field.type, clonedField);

      // Выбираем склонированное поле
      this.selectedFieldId = clonedField.id;

      this.renderFieldsListWithoutPreview();
      this.renderFieldEditor();
    }
  }

  private moveField(fieldId: string, newPosition: number): void {
    this.formManager.moveField(fieldId, newPosition);
    this.renderFieldsListWithoutPreview();
  }

  private updatePreview(): void {
    if (!this.previewContainer || !this.formPreview) return;

    const formConfig = this.formManager.getFormConfig();
    if (formConfig && formConfig.fields.length > 0) {
      this.formPreview.createPreview(formConfig);
    } else {
      // Показываем сообщение о том, что нет полей для предпросмотра
      this.previewContainer.innerHTML = '<p class="no-preview-message">No fields to preview</p>';
    }
  }

  private saveForm(): void {
    const formConfig = this.formManager.getFormConfig();
    if (!formConfig) return;

    if (this.isEditMode && this.existingFormElement) {
      // Режим редактирования - заменяем существующую форму
      if (confirm(this.editor.t('Are you sure you want to update this form?'))) {
        this.existingFormElement.outerHTML = this.formManager.createForm(formConfig);
        this.popup?.hide();
        this.destroy();
      }
    } else {
      // Режим создания - вставляем новую форму
      this.callback?.(formConfig);
      this.popup?.hide();
      this.destroy();
    }
  }

  public show(
    callback: (formConfig: FormConfig) => void,
    editMode: boolean = false,
    existingFormElement: HTMLElement | null = null
  ): void {
    this.callback = callback;
    this.isEditMode = editMode;
    this.existingFormElement = existingFormElement;

    // Если режим редактирования, загружаем существующую форму
    if (editMode && existingFormElement) {
      this.formManager.loadForm(existingFormElement);
      // Обновляем заголовок и кнопки для режима редактирования
      this.updatePopupForEditMode();
      // Обновляем интерфейс с загруженными данными
      this.updateFormSettings();
      this.renderFieldsListWithoutPreview();
      this.renderFieldEditor();
    } else {
      // Режим создания - очищаем данные
      this.selectedFieldId = null;
      // Обновляем заголовок и кнопки для режима создания
      this.updatePopupForCreateMode();
    }

    this.popup?.show();
    // Автофокус на поле Action URL
    setTimeout(() => {
      const urlInput = this.editor
        .getDOMContext()
        .getElementById('form-action-url') as HTMLInputElement;
      if (urlInput) urlInput.focus();
    }, 0);
    this.updatePreview();
  }

  private updatePopupForEditMode(): void {
    // Обновляем заголовок и кнопки для режима редактирования
    const headerTitle = this.popup?.getElement().querySelector('.popup-header-title');
    if (headerTitle) {
      headerTitle.textContent = this.editor.t('Edit Form');
    }

    const saveButton = this.popup
      ?.getElement()
      .querySelector('.popup-footer button[data-variant="primary"]');
    if (saveButton) {
      saveButton.textContent = this.editor.t('Update Form');
    }
  }

  private updatePopupForCreateMode(): void {
    // Обновляем заголовок и кнопки для режима создания
    const headerTitle = this.popup?.getElement().querySelector('.popup-header-title');
    if (headerTitle) {
      headerTitle.textContent = this.editor.t('Form Builder');
    }

    const saveButton = this.popup
      ?.getElement()
      .querySelector('.popup-footer button[data-variant="primary"]');
    if (saveButton) {
      saveButton.textContent = this.editor.t('Save Form');
    }
  }

  private updateFormSettings(): void {
    // Обновляем метод формы
    const methodSelect = this.popup
      ?.getElement()
      .querySelector('.form-settings-panel select') as HTMLSelectElement;
    if (methodSelect) {
      methodSelect.value = this.formManager.getFormMethod();
    }

    // Обновляем Action URL
    const urlInput = this.popup
      ?.getElement()
      .querySelector('.form-settings-panel input[type="text"]') as HTMLInputElement;
    if (urlInput) {
      urlInput.value = this.formManager.getFormAction() || '';
    }
  }

  public destroy(): void {
    // Удаляем обработчики событий
    this.editor.getDOMContext().removeEventListener('keydown', this.handleEscapeKey);

    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    if (this.fieldEditor) {
      this.fieldEditor = null;
    }
    if (this.formPreview) {
      this.formPreview = null;
    }
  }

  private handleEscapeKey = (e: Event): void => {
    if ((e as KeyboardEvent).key === 'Escape' && this.popup?.isOpen()) {
      this.popup?.hide();
      this.destroy();
    }
  };

  private openTemplatesModal(): void {
    // Закрываем текущую модалку
    this.popup?.hide();

    // Открываем модалку шаблонов
    this.templatesModal?.show((template) => {
      if (template && template.config) {
        // Создаем новую модалку с загруженным шаблоном
        const newFormBuilderModal = new FormBuilderModal(this.editor);
        newFormBuilderModal.show(
          (formConfig: FormConfig) => {
            // Создаем форму с использованием formManager, как в основном файле
            const formHtml = this.formManager.createForm(formConfig);

            // Восстанавливаем позицию курсора и вставляем форму
            this.editor.ensureEditorFocus();
            const range = this.editor.getSelector()?.restoreSelection(this.editor.getContainer());

            if (range) {
              const formElement = document.createElement('div');
              formElement.innerHTML = formHtml;

              // Получаем элемент формы
              const formNode = formElement.firstElementChild;

              if (formNode) {
                range.deleteContents();
                range.insertNode(formNode);
                range.collapse(false);
                this.editor.getSelector()?.saveSelection();
              }
            } else {
              // Fallback: если не удалось восстановить позицию, используем insertContent
              this.editor?.insertContent(formHtml);
            }

            this.editor?.insertContent(createLineBreak());
          },
          false,
          null
        );

        // Загружаем шаблон в новую модалку
        newFormBuilderModal.loadFormConfig(template.config);
      }
    });
  }

  // Добавляем метод для загрузки конфигурации формы
  public loadFormConfig(formConfig: FormConfig): void {
    this.formManager.loadFormConfig(formConfig);
    this.selectedFieldId = null;
    this.updateFormSettings();
    this.renderFieldsListWithoutPreview();
    this.renderFieldEditor();
    this.updatePreview();
  }

  // Добавляю методы drag and drop
  private dragStartIndex: number | null = null;
  private handleDragStart(e: DragEvent, index: number): void {
    this.dragStartIndex = index;
    e.dataTransfer?.setData('text/plain', index.toString());
  }
  private handleDragOver(e: DragEvent, _index: number): void {
    e.preventDefault();
  }
  private handleDrop(e: DragEvent, index: number): void {
    e.preventDefault();
    if (this.dragStartIndex !== null && this.dragStartIndex !== index) {
      const fields = this.formManager.getFields();
      const field = fields[this.dragStartIndex];
      this.formManager.moveField(field.id, index);
      this.renderFieldsListWithoutPreview();
      this.dragStartIndex = null;
    }
  }

  private onFieldTypeChange(fieldId: string, newType: FieldType): void {
    // Получаем текущее поле
    const currentField = this.formManager.getField(fieldId);
    if (!currentField) return;

    // Создаем базовые опции для нового типа
    const baseOptions: any = {
      name: currentField.options?.name || fieldId,
      placeholder: currentField.options?.placeholder || '',
      className: currentField.options?.className || '',
      readonly: currentField.options?.readonly || false,
      disabled: currentField.options?.disabled || false,
    };

    // Добавляем специфичные опции в зависимости от типа
    switch (newType) {
      case 'select':
      case 'radio':
        baseOptions.options = currentField.options?.options || [];
        baseOptions.multiple =
          newType === 'select' ? currentField.options?.multiple || false : false;
        // Если опций нет, добавляем пустую опцию
        if (baseOptions.options.length === 0) {
          const defaultText =
            newType === 'radio' ? this.editor.t('New Radio') : this.editor.t('Option 1');
          baseOptions.options = [defaultText];
        }
        break;
      case 'checkbox':
        // Для чекбокса сохраняем только базовые опции, опции не нужны
        baseOptions.value =
          currentField.options?.value || currentField.label || this.editor.t('New Checkbox');
        baseOptions.checked = currentField.options?.checked || false;
        break;
      case 'number':
      case 'range':
        baseOptions.min = currentField.options?.min || '';
        baseOptions.max = currentField.options?.max || '';
        baseOptions.step = currentField.options?.step || '';
        break;
      case 'textarea':
        baseOptions.rows = currentField.options?.rows || 3;
        baseOptions.cols = currentField.options?.cols || 50;
        break;
      case 'file':
        baseOptions.accept = currentField.options?.accept || '';
        baseOptions.multiple = currentField.options?.multiple || false;
        break;
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'month':
      case 'week':
        baseOptions.min = currentField.options?.min || '';
        baseOptions.max = currentField.options?.max || '';
        break;
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
        baseOptions.maxlength = currentField.options?.maxlength || '';
        baseOptions.minlength = currentField.options?.minlength || '';
        break;
      case 'color':
        baseOptions.value = currentField.options?.value || '#000000';
        break;
      case 'image':
        baseOptions.src = currentField.options?.src || '';
        baseOptions.alt = currentField.options?.alt || '';
        break;
    }

    // Обновляем поле в FormManager с новым типом и очищенными опциями
    const updates: Partial<FieldConfig> = {
      type: newType,
      options: baseOptions,
    };

    // Обрабатываем валидацию в зависимости от типа
    if (currentField.validation) {
      const validation = { ...currentField.validation };

      // Очищаем несовместимые правила валидации
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

    // Пересоздаем интерфейс редактора поля
    this.renderFieldEditor();

    // Обновляем предпросмотр
    this.updatePreview();
  }

  private onOptionsChange(_fieldId: string): void {
    // Пересоздаем интерфейс редактора поля
    this.renderFieldEditor();

    // Обновляем предпросмотр
    this.updatePreview();
  }
}
