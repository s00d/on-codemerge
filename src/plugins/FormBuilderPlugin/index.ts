import './style.scss';
import './public.scss';

import type { HTMLEditor } from '../../app';
import { PopupManager } from '../../core/ui/PopupManager';
import type { Plugin } from '../../core/Plugin';
import { ContextMenu } from '../../core/ui/ContextMenu.ts';
import { deleteIcon, editIcon, formIcon } from '../../icons/';
import { FormManager } from './services/FormManager.ts';
import type { FieldConfig } from './services/FieldBuilder.ts';
import { createToolbarButton } from '../ToolbarPlugin/utils.ts';
import {
  createInputField,
  createSelectField,
  createCheckbox,
  createLabel,
  createButton,
  createContainer,
  createLineBreak,
} from '../../utils/helpers';

export class FormBuilderPlugin implements Plugin {
  name = 'form-builder';
  private editor: HTMLEditor | null = null;
  private popup: PopupManager | null = null;
  private contextMenu: ContextMenu | null = null;
  container: HTMLDivElement | null = null;
  private editFormElement: HTMLElement | null = null;
  private formManager: FormManager;
  private type: 'POST' | 'GET' = 'GET';
  private url: string = '';
  private formButton: HTMLButtonElement | null = null;

  constructor() {
    this.formManager = new FormManager();
  }

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.setupPopup();
    this.addToolbarButton();
    this.setupContextMenu();

    this.editor.on('form', () => {
      this.formManager.clearFields();
      this.addFormField('text', 'New Field', false, '', []);
      this.popup?.show();
    });
  }

  private setupContextMenu(): void {
    if (!this.editor) return;

    this.contextMenu = new ContextMenu(this.editor, [
      {
        title: 'Edit Form',
        icon: editIcon,
        onClick: (element) => this.editForm(element),
      },
      {
        title: 'Delete Form',
        icon: deleteIcon,
        onClick: (element) => this.deleteForm(element),
      },
    ]);

    this.editor.getInnerContainer().addEventListener('contextmenu', (e) => {
      const form = (e.target as Element).closest('form');
      if (form) {
        e.preventDefault();
        const mouseX = (e as MouseEvent).clientX + window.scrollX;
        const mouseY = (e as MouseEvent).clientY + window.scrollY;

        console.log('Mouse coordinates with scroll:', mouseX, mouseY);

        this.contextMenu?.show(form, mouseX, mouseY);
      }
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      this.formButton = createToolbarButton({
        icon: formIcon,
        title: 'Insert Form',
        onClick: () => {
          this.formManager.clearFields();
          this.addFormField('text', 'New Field', false, '', []);
          this.popup?.show();
        },
      });

      toolbar.appendChild(this.formButton);
    }
  }

  private setupPopup(): void {
    if (!this.editor) return;

    this.popup = new PopupManager(this.editor, {
      title: 'Form Builder',
      className: 'form-builder',
      closeOnClickOutside: true,
      buttons: [
        {
          label: 'Add Field',
          variant: 'info',
          onClick: () => this.addFormField(),
        },
        {
          label: 'Insert',
          variant: 'primary',
          onClick: () => this.handleFormInsert(this.url, this.type),
        },
        {
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => this.popup?.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'form-builder-content',
          content: () => this.createFormBuilderContent(),
        },
      ],
    });
  }

  private createFormBuilderContent(): HTMLElement {
    this.container = createContainer('form-builder-container p-4');

    this.formManager.clearOptions();

    return this.container;
  }

  private addFormField(
    type: string = 'text',
    label: string = '',
    isRequired: boolean = false,
    regexPattern: string = '',
    options: string[] = [],
    buttonActionValue: string = ''
  ): void {
    const fieldConfig: FieldConfig = {
      type,
      label,
      options: {
        placeholder: '',
        className: 'form-input',
        target: buttonActionValue,
        options: [],
      },
      validation: {
        required: isRequired,
        pattern: regexPattern,
      },
    };

    if (type === 'select' && fieldConfig.options) {
      fieldConfig.options.options = options;
    }

    this.formManager.addField(fieldConfig);
    this.renderFormBuilderContent();
  }

  private renderFormBuilderContent(): void {
    if (!this.container) return;

    // Очищаем контейнер
    this.container.innerHTML = '';

    // Добавляем контейнер для типа формы и URL
    const formTypeContainer = createContainer('form-type-container mb-4');
    const formTypeLabel = createLabel('Form Method:');
    const formTypeSelect = createSelectField(
      [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
      ],
      this.type,
      (value) => {
        this.type = value as 'GET' | 'POST';
      }
    );
    formTypeContainer.appendChild(formTypeLabel);
    formTypeContainer.appendChild(formTypeSelect);

    // Добавляем поле для ввода URL
    const formUrlContainer = createContainer('form-url-container mb-4');
    const formUrlLabel = createLabel('Form URL:');
    const formUrlInput = createInputField(
      'text',
      'Enter form submission URL',
      this.url,
      (value) => {
        this.url = value;
      }
    );
    formUrlContainer.appendChild(formUrlLabel);
    formUrlContainer.appendChild(formUrlInput);

    // Добавляем контейнеры в основной контейнер
    this.container.appendChild(formTypeContainer);
    this.container.appendChild(formUrlContainer);

    // Получаем текущие поля из FormManager
    const fields = this.formManager.getFields();

    let lasId = 1;

    fields.forEach((fieldConfig, index) => {
      const fieldContainer = createContainer(
        'field-container mb-4 p-3 border border-gray-200 rounded bg-gray-50'
      );

      // Массив конфигураций для полей
      const fieldConfigurations = [
        {
          type: 'select',
          label: 'Field Type',
          value: fieldConfig.type,
          options: [
            { value: 'text', label: 'Text Input' },
            { value: 'textarea', label: 'Text Area' },
            { value: 'select', label: 'Dropdown' },
            { value: 'checkbox', label: 'Checkbox' },
            { value: 'radio', label: 'Radio Button' },
            { value: 'button', label: 'Button' },
            { value: 'file', label: 'File Upload' },
            { value: 'date', label: 'Date' },
            { value: 'time', label: 'Time' },
            { value: 'range', label: 'Range' },

            { value: 'email', label: 'Email' },
            { value: 'password', label: 'Password' },
            { value: 'number', label: 'Number' },
            { value: 'tel', label: 'Phone' },
            { value: 'url', label: 'URL' },
            { value: 'color', label: 'Color' },
            { value: 'datetime-local', label: 'Date & Time' },
            { value: 'month', label: 'Month' },
            { value: 'week', label: 'Week' },
            { value: 'hidden', label: 'Hidden' },
            { value: 'image', label: 'Image Button' },
          ],
          onChange: (value: string) => {
            fieldConfig.type = value;
            this.renderFormBuilderContent();
          },
        },
        {
          type: 'input',
          label: 'Field Label',
          value: fieldConfig.label,
          onChange: (value: string) => {
            fieldConfig.label = value;
          },
        },
        {
          type: 'input',
          label: 'Regex Validation',
          value: fieldConfig.validation?.pattern || '',
          onChange: (value: string) => {
            if (!fieldConfig.validation) fieldConfig.validation = {};
            fieldConfig.validation.pattern = value;
          },
        },
        {
          type: 'input',
          label: 'Placeholder',
          value: fieldConfig.options?.placeholder || '',
          onChange: (value: string) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.placeholder = value;
          },
        },
        {
          type: 'select',
          label: 'Autocomplete',
          value: fieldConfig.options?.autocomplete || 'on',
          options: [
            { value: 'on', label: 'On' },
            { value: 'off', label: 'Off' },
          ],
          onChange: (value: string) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.autocomplete = value;
          },
        },
        {
          type: 'checkbox',
          label: null,
          title: 'Required',
          value: fieldConfig.validation?.required || false,
          onChange: (isChecked: boolean) => {
            if (!fieldConfig.validation) fieldConfig.validation = {};
            fieldConfig.validation.required = isChecked;
          },
        },
        {
          type: 'checkbox',
          label: null,
          title: 'ReadOnly',
          value: fieldConfig.options?.readonly || false,
          onChange: (isChecked: boolean) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.readonly = isChecked;
          },
        },
        {
          type: 'checkbox',
          label: null,
          title: 'Disabled',
          value: fieldConfig.options?.disabled || false,
          onChange: (isChecked: boolean) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.disabled = isChecked;
          },
        },
        {
          type: 'checkbox',
          label: null,
          title: 'Multiple',
          value: fieldConfig.options?.multiple || false,
          onChange: (isChecked: boolean) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.multiple = isChecked;
          },
        },
        {
          type: 'input',
          label: 'Name',
          value: fieldConfig.options?.name || '',
          onChange: (value: string) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.name = value;
          },
        },
        {
          type: 'input',
          label: 'Value',
          value: fieldConfig.options?.value || '',
          onChange: (value: string) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.value = value;
          },
        },
        {
          type: 'input',
          label: 'Class Name',
          value: fieldConfig.options?.className || '',
          onChange: (value: string) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.className = value;
          },
        },
        {
          type: 'input',
          label: 'ID',
          value: fieldConfig.options?.id || 'input-' + lasId++,
          onChange: (value: string) => {
            if (!fieldConfig.options) fieldConfig.options = {};
            fieldConfig.options.id = value;
          },
        },
      ];

      // Создаем поля на основе конфигураций
      fieldConfigurations.forEach((config) => {
        let label: HTMLLabelElement | null = null;
        if (config.label) {
          label = createLabel(config.label);
        }
        let field: HTMLElement;

        switch (config.type) {
          case 'input':
            field = createInputField(
              'text',
              '',
              config.value as string,
              config.onChange as (value: string) => void
            );
            break;
          case 'select':
            field = createSelectField(
              config.options || [],
              config.value as string,
              config.onChange as (value: string) => void
            );
            break;
          case 'checkbox':
            field = createCheckbox(
              config.label ?? config.title,
              config.value as boolean,
              config.onChange as (isChecked: boolean) => void
            );
            break;
          default:
            field = createContainer();
            break;
        }

        const fieldWrapper = createContainer('field-wrapper mb-2');
        if (label) fieldWrapper.appendChild(label);
        fieldWrapper.appendChild(field);
        fieldContainer.appendChild(fieldWrapper);

        if (config.label === 'Field Type') {
          // Контейнер для опций (если поле типа "select")
          const optionsContainer = createContainer('options-container mt-2');

          if (fieldConfig.type === 'select' && fieldConfig.options?.options) {
            fieldConfig.options.options.forEach((optionValue, optionIndex) => {
              const optionInput = createInputField('text', 'Option Value', optionValue, (value) => {
                fieldConfig.options!.options![optionIndex] = value;
              });

              const removeOptionButton = createButton(
                'Remove',
                () => {
                  fieldConfig.options!.options = fieldConfig.options!.options!.filter(
                    (_, index) => index !== optionIndex
                  );
                  this.renderFormBuilderContent();
                },
                'danger'
              );

              const optionDiv = createContainer('option-container flex items-center mb-2');
              optionDiv.appendChild(optionInput);
              optionDiv.appendChild(removeOptionButton);
              optionsContainer.appendChild(optionDiv);
            });

            const addOptionButton = createButton(
              'Add Option',
              () => {
                if (!fieldConfig.options) fieldConfig.options = {};
                if (!fieldConfig.options.options) fieldConfig.options.options = [];
                fieldConfig.options.options.push('');
                this.renderFormBuilderContent();
              },
              'primary'
            );

            optionsContainer.appendChild(addOptionButton);
          }

          fieldContainer.appendChild(optionsContainer);
        }
      });

      // Кнопка для удаления поля
      const removeButton = createButton(
        'Remove',
        () => {
          this.formManager.removeField(index);
          this.renderFormBuilderContent();
        },
        'danger'
      );

      fieldContainer.appendChild(removeButton);

      // Добавляем контейнер поля в основной контейнер
      this.container?.appendChild(fieldContainer);
    });
  }

  private handleFormInsert(url: string, type: 'POST' | 'GET' = 'GET'): void {
    if (!this.editor || !this.popup) return;

    if (this.editFormElement) {
      this.editFormElement.remove();
      this.editFormElement = null;
    }

    const form = this.formManager.createForm(url, type);

    // Вставляем форму в редактор
    this.editor.insertContent(form.outerHTML);
    this.editor.insertContent(createLineBreak());
    this.popup.hide();
  }

  private editForm(formElement: HTMLElement | null): void {
    if (!formElement) return;

    this.editFormElement = formElement;

    // Открываем модальное окно с текущими настройками формы
    this.popup?.show();

    this.formManager.clearFields();

    // Очищаем контейнер формы перед добавлением новых полей
    const formBuilderContainer = this.popup
      ?.getElement()
      ?.querySelector('.form-builder-container') as HTMLElement;
    if (formBuilderContainer) {
      formBuilderContainer.innerHTML = '';
    }

    // Проходим по всем полям формы и восстанавливаем их настройки
    const fields = formElement.querySelectorAll('.form-field');
    fields.forEach((field) => {
      const label = field.querySelector('label')?.textContent || '';
      const input = field.querySelector('input, select, textarea, button');
      const type = input?.tagName.toLowerCase() || 'text';

      // Извлекаем дополнительные параметры
      const isRequired = input?.hasAttribute('required') || false;
      const regexPattern = input?.getAttribute('pattern') || '';
      const options: string[] = [];

      // Если поле - выпадающий список, извлекаем опции
      if (type === 'select') {
        const selectOptions = input?.querySelectorAll('option');
        selectOptions?.forEach((option) => {
          options.push(option.value);
        });
      }

      console.log(2222, type, label, isRequired, regexPattern, options);
      // Добавляем поле с восстановленными настройками
      this.addFormField(type, label, isRequired, regexPattern, options);
    });
  }

  private deleteForm(formElement: HTMLElement | null): void {
    if (!formElement) return;

    formElement.remove();
  }

  destroy(): void {
    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    if (this.formButton) {
      this.formButton.remove();
    }
    this.editor = null;
  }
}
