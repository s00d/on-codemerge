import type { FieldConfig, FieldType } from '../types';
import type { HTMLEditor } from '../../../app';
import type { FormManager } from '../services/FormManager';
import {
  createInputField,
  createSelectField,
  createCheckbox,
  createLabel,
  createButton,
  createContainer,
} from '../../../utils/helpers';

export class FieldEditor {
  private editor: HTMLEditor;
  private formManager: FormManager;
  private readonly onUpdate: (fieldId: string, updates: Partial<FieldConfig>) => void;
  private readonly onRemove: (fieldId: string) => void;
  private readonly onClone: (fieldId: string) => void;
  private readonly onTypeChange?: (fieldId: string, newType: FieldType) => void;
  private readonly onOptionsChange?: (fieldId: string) => void;

  constructor(
    onUpdate: (fieldId: string, updates: Partial<FieldConfig>) => void,
    onRemove: (fieldId: string) => void,
    onClone: (fieldId: string) => void,
    editor: HTMLEditor,
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

  /**
   * Create field editor
   */
  createFieldEditor(field: FieldConfig): HTMLElement {
    const fieldContainer = createContainer(
      'field-editor-container mb-4 p-4 border border-gray-200 rounded bg-gray-50'
    );

    // Field header
    const header = createContainer('field-header flex justify-between items-center mb-3');
    const title = createContainer('field-title text-lg font-semibold');
    title.textContent = field.label || this.editor.t('Untitled Field');

    const actions = createContainer('field-actions flex gap-2');
    const cloneButton = createButton(
      this.editor.t('Copy'),
      () => this.onClone(field.id),
      'secondary'
    );
    const removeButton = createButton(
      this.editor.t('Remove'),
      () => this.onRemove(field.id),
      'danger'
    );

    actions.appendChild(cloneButton);
    actions.appendChild(removeButton);
    header.appendChild(title);
    header.appendChild(actions);
    fieldContainer.appendChild(header);

    // Main field settings
    const mainSettings = this.createMainSettings(field);
    fieldContainer.appendChild(mainSettings);

    // Field options settings
    const optionsSettings = this.createOptionsSettings(field);
    fieldContainer.appendChild(optionsSettings);

    // Validation settings
    const validationSettings = this.createValidationSettings(field);
    fieldContainer.appendChild(validationSettings);

    return fieldContainer;
  }

  /**
   * Create main field settings
   */
  private createMainSettings(field: FieldConfig): HTMLElement {
    const section = createContainer('main-settings mb-4');
    const title = createContainer('section-title text-md font-medium mb-2');
    title.textContent = this.editor.t('Main Settings');
    section.appendChild(title);

    // Field type
    const typeContainer = createContainer('setting-group mb-3');
    const typeLabel = createLabel(this.editor.t('Field Type:'));
    const typeSelect = createSelectField(this.getFieldTypeOptions(), field.type, (value) => {
      const newType = value as FieldType;
      this.onUpdate(field.id, { type: newType });
      if (this.onTypeChange) {
        this.onTypeChange(field.id, newType);
      }
    });
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(typeSelect);
    section.appendChild(typeContainer);

    // Field label
    const labelContainer = createContainer('setting-group mb-3');
    const labelLabel = createLabel(this.editor.t('Field Label:'));
    const labelInput = createInputField(
      'text',
      this.editor.t('Enter field label'),
      field.label,
      (value) => this.onUpdate(field.id, { label: value })
    );
    labelContainer.appendChild(labelLabel);
    labelContainer.appendChild(labelInput);
    section.appendChild(labelContainer);

    // Placeholder
    const placeholderContainer = createContainer('setting-group mb-3');
    const placeholderLabel = createLabel(this.editor.t('Placeholder:'));
    const placeholderInput = createInputField(
      'text',
      this.editor.t('Enter placeholder text'),
      field.options?.placeholder || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, placeholder: value },
        })
    );
    placeholderContainer.appendChild(placeholderLabel);
    placeholderContainer.appendChild(placeholderInput);
    section.appendChild(placeholderContainer);

    return section;
  }

  /**
   * Create field options settings
   */
  private createOptionsSettings(field: FieldConfig): HTMLElement {
    const section = createContainer('options-settings mb-4');
    const title = createContainer('section-title text-md font-medium mb-2');
    title.textContent = this.editor.t('Additional Options');
    section.appendChild(title);

    // Field name
    const nameContainer = createContainer('setting-group mb-3');
    const nameLabel = createLabel(this.editor.t('Field Name (name):'));
    const nameInput = createInputField(
      'text',
      this.editor.t('Enter field name'),
      field.options?.name || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, name: value },
        })
    );
    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);
    section.appendChild(nameContainer);

    // Field ID
    const idContainer = createContainer('setting-group mb-3');
    const idLabel = createLabel(this.editor.t('Field ID:'));
    const idInput = createInputField(
      'text',
      this.editor.t('Enter field ID'),
      field.options?.id || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, id: value },
        })
    );
    idContainer.appendChild(idLabel);
    idContainer.appendChild(idInput);
    section.appendChild(idContainer);

    // CSS class
    const classContainer = createContainer('setting-group mb-3');
    const classLabel = createLabel(this.editor.t('CSS Class:'));
    const classInput = createInputField(
      'text',
      this.editor.t('Enter CSS class'),
      field.options?.className || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, className: value },
        })
    );
    classContainer.appendChild(classLabel);
    classContainer.appendChild(classInput);
    section.appendChild(classContainer);

    // Checkboxes
    const checkboxesContainer = createContainer('checkboxes-group flex flex-wrap gap-4 mb-3');

    const readonlyCheckbox = createCheckbox(
      this.editor.t('Read Only'),
      field.options?.readonly || false,
      (checked) =>
        this.onUpdate(field.id, {
          options: { ...field.options, readonly: checked },
        })
    );

    const disabledCheckbox = createCheckbox(
      this.editor.t('Disabled'),
      field.options?.disabled || false,
      (checked) =>
        this.onUpdate(field.id, {
          options: { ...field.options, disabled: checked },
        })
    );

    const multipleCheckbox = createCheckbox(
      this.editor.t('Multiple Selection'),
      field.options?.multiple || false,
      (checked) =>
        this.onUpdate(field.id, {
          options: { ...field.options, multiple: checked },
        })
    );

    checkboxesContainer.appendChild(readonlyCheckbox);
    checkboxesContainer.appendChild(disabledCheckbox);
    checkboxesContainer.appendChild(multipleCheckbox);
    section.appendChild(checkboxesContainer);

    // Type-specific options
    const typeSpecificOptions = this.createTypeSpecificOptions(field);
    if (typeSpecificOptions) {
      section.appendChild(typeSpecificOptions);
    }

    // Options for select/radio
    if (field.type === 'select' || field.type === 'radio') {
      const optionsSection = this.createOptionsList(field);
      section.appendChild(optionsSection);
    }

    return section;
  }

  /**
   * Create type-specific options
   */
  private createTypeSpecificOptions(field: FieldConfig): HTMLElement | null {
    const section = createContainer('type-specific-options mb-3');
    const title = createContainer('section-title text-sm font-medium mb-2');
    title.textContent = this.editor.t('Type-Specific Options');
    section.appendChild(title);

    switch (field.type) {
      case 'checkbox':
        this.addCheckboxOptions(section, field);
        break;
      case 'number':
      case 'range':
        this.addNumberOptions(section, field);
        break;
      case 'textarea':
        this.addTextareaOptions(section, field);
        break;
      case 'file':
        this.addFileOptions(section, field);
        break;
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'month':
      case 'week':
        this.addDateOptions(section, field);
        break;
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
        this.addTextOptions(section, field);
        break;
      case 'color':
        this.addColorOptions(section, field);
        break;
      case 'image':
        this.addImageOptions(section, field);
        break;
      default:
        return null;
    }

    return section;
  }

  /**
   * Add checkbox-specific options
   */
  private addCheckboxOptions(section: HTMLElement, field: FieldConfig): void {
    // Checkbox text
    const textContainer = createContainer('setting-group mb-2');
    const textLabel = createLabel(this.editor.t('Checkbox Text:'));
    const currentText = field.options?.value || field.label || '';
    const textInput = createInputField(
      'text',
      this.editor.t('Enter text to display next to checkbox'),
      currentText,
      (value) => {
        // Получаем актуальные опции из FormManager
        const currentField = this.formManager.getField(field.id);
        const currentOptions = currentField?.options || {};
        this.onUpdate(field.id, {
          options: { ...currentOptions, value: value },
        });
      }
    );
    textContainer.appendChild(textLabel);
    textContainer.appendChild(textInput);
    section.appendChild(textContainer);

    // Checked by default
    const checkedContainer = createContainer('setting-group mb-2');
    const currentChecked = field.options?.checked || false;
    const checkedCheckbox = createCheckbox(
      this.editor.t('Checked by Default'),
      currentChecked,
      (checked) => {
        // Получаем актуальные опции из FormManager
        const currentField = this.formManager.getField(field.id);
        const currentOptions = currentField?.options || {};
        this.onUpdate(field.id, {
          options: { ...currentOptions, checked: checked },
        });
      }
    );
    checkedContainer.appendChild(checkedCheckbox);
    section.appendChild(checkedContainer);
  }

  /**
   * Add number-specific options
   */
  private addNumberOptions(section: HTMLElement, field: FieldConfig): void {
    // Min value
    const minContainer = createContainer('setting-group mb-2');
    const minLabel = createLabel(this.editor.t('Minimum Value:'));
    const minValue = field.options?.min !== undefined ? String(field.options.min) : '';
    const minInput = createInputField(
      'number',
      this.editor.t('Enter minimum value'),
      minValue,
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, min: value ? parseFloat(value) : undefined },
        })
    );
    minContainer.appendChild(minLabel);
    minContainer.appendChild(minInput);
    section.appendChild(minContainer);

    // Max value
    const maxContainer = createContainer('setting-group mb-2');
    const maxLabel = createLabel(this.editor.t('Maximum Value:'));
    const maxValue = field.options?.max !== undefined ? String(field.options.max) : '';
    const maxInput = createInputField(
      'number',
      this.editor.t('Enter maximum value'),
      maxValue,
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, max: value ? parseFloat(value) : undefined },
        })
    );
    maxContainer.appendChild(maxLabel);
    maxContainer.appendChild(maxInput);
    section.appendChild(maxContainer);

    // Step value
    const stepContainer = createContainer('setting-group mb-2');
    const stepLabel = createLabel(this.editor.t('Step Value:'));
    const stepValue = field.options?.step !== undefined ? String(field.options.step) : '';
    const stepInput = createInputField(
      'number',
      this.editor.t('Enter step value'),
      stepValue,
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, step: value ? parseFloat(value) : undefined },
        })
    );
    stepContainer.appendChild(stepLabel);
    stepContainer.appendChild(stepInput);
    section.appendChild(stepContainer);
  }

  /**
   * Add textarea-specific options
   */
  private addTextareaOptions(section: HTMLElement, field: FieldConfig): void {
    // Rows
    const rowsContainer = createContainer('setting-group mb-2');
    const rowsLabel = createLabel(this.editor.t('Rows:'));
    const rowsValue = field.options?.rows !== undefined ? String(field.options.rows) : '4';
    const rowsInput = createInputField(
      'number',
      this.editor.t('Enter number of rows'),
      rowsValue,
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, rows: value ? parseInt(value) : 4 },
        })
    );
    rowsContainer.appendChild(rowsLabel);
    rowsContainer.appendChild(rowsInput);
    section.appendChild(rowsContainer);

    // Columns
    const colsContainer = createContainer('setting-group mb-2');
    const colsLabel = createLabel(this.editor.t('Columns:'));
    const colsValue = field.options?.cols !== undefined ? String(field.options.cols) : '50';
    const colsInput = createInputField(
      'number',
      this.editor.t('Enter number of columns'),
      colsValue,
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, cols: value ? parseInt(value) : 50 },
        })
    );
    colsContainer.appendChild(colsLabel);
    colsContainer.appendChild(colsInput);
    section.appendChild(colsContainer);
  }

  /**
   * Add file-specific options
   */
  private addFileOptions(section: HTMLElement, field: FieldConfig): void {
    // Accept
    const acceptContainer = createContainer('setting-group mb-2');
    const acceptLabel = createLabel(this.editor.t('Accepted File Types:'));
    const acceptInput = createInputField(
      'text',
      this.editor.t('e.g., .pdf,.doc,.jpg'),
      field.options?.accept || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, accept: value },
        })
    );
    acceptContainer.appendChild(acceptLabel);
    acceptContainer.appendChild(acceptInput);
    section.appendChild(acceptContainer);

    // Multiple files
    const multipleContainer = createContainer('setting-group mb-2');
    const multipleCheckbox = createCheckbox(
      this.editor.t('Allow Multiple Files'),
      field.options?.multiple || false,
      (checked) =>
        this.onUpdate(field.id, {
          options: { ...field.options, multiple: checked },
        })
    );
    multipleContainer.appendChild(multipleCheckbox);
    section.appendChild(multipleContainer);
  }

  /**
   * Add date-specific options
   */
  private addDateOptions(section: HTMLElement, field: FieldConfig): void {
    // Min date
    const minContainer = createContainer('setting-group mb-2');
    const minLabel = createLabel(this.editor.t('Minimum Date:'));
    const minInput = createInputField(
      'date',
      this.editor.t('Select minimum date'),
      field.options?.min?.toString() || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, min: value },
        })
    );
    minContainer.appendChild(minLabel);
    minContainer.appendChild(minInput);
    section.appendChild(minContainer);

    // Max date
    const maxContainer = createContainer('setting-group mb-2');
    const maxLabel = createLabel(this.editor.t('Maximum Date:'));
    const maxInput = createInputField(
      'date',
      this.editor.t('Select maximum date'),
      field.options?.max?.toString() || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, max: value },
        })
    );
    maxContainer.appendChild(maxLabel);
    maxContainer.appendChild(maxInput);
    section.appendChild(maxContainer);
  }

  /**
   * Add text-specific options
   */
  private addTextOptions(section: HTMLElement, field: FieldConfig): void {
    // Size
    const sizeContainer = createContainer('setting-group mb-2');
    const sizeLabel = createLabel(this.editor.t('Size:'));
    const sizeInput = createInputField(
      'number',
      this.editor.t('Enter field size'),
      field.options?.size?.toString() || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, size: parseInt(value) || undefined },
        })
    );
    sizeContainer.appendChild(sizeLabel);
    sizeContainer.appendChild(sizeInput);
    section.appendChild(sizeContainer);

    // Max length
    const maxLengthContainer = createContainer('setting-group mb-2');
    const maxLengthLabel = createLabel(this.editor.t('Maximum Length:'));
    const maxLengthInput = createInputField(
      'number',
      this.editor.t('Enter maximum length'),
      field.options?.maxlength?.toString() || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, maxlength: parseInt(value) || undefined },
        })
    );
    maxLengthContainer.appendChild(maxLengthLabel);
    maxLengthContainer.appendChild(maxLengthInput);
    section.appendChild(maxLengthContainer);

    // Min length
    const minLengthContainer = createContainer('setting-group mb-2');
    const minLengthLabel = createLabel(this.editor.t('Minimum Length:'));
    const minLengthInput = createInputField(
      'number',
      this.editor.t('Enter minimum length'),
      field.options?.minlength?.toString() || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, minlength: parseInt(value) || undefined },
        })
    );
    minLengthContainer.appendChild(minLengthLabel);
    minLengthContainer.appendChild(minLengthInput);
    section.appendChild(minLengthContainer);

    // Autocomplete
    const autocompleteContainer = createContainer('setting-group mb-2');
    const autocompleteLabel = createLabel(this.editor.t('Autocomplete:'));
    const autocompleteSelect = createSelectField(
      [
        { value: '', label: this.editor.t('Default') },
        { value: 'on', label: this.editor.t('On') },
        { value: 'off', label: this.editor.t('Off') },
        { value: 'name', label: this.editor.t('Name') },
        { value: 'email', label: this.editor.t('Email') },
        { value: 'tel', label: this.editor.t('Phone') },
        { value: 'url', label: this.editor.t('URL') },
        { value: 'current-password', label: this.editor.t('Current Password') },
        { value: 'new-password', label: this.editor.t('New Password') },
      ],
      field.options?.autocomplete || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, autocomplete: value as any },
        })
    );
    autocompleteContainer.appendChild(autocompleteLabel);
    autocompleteContainer.appendChild(autocompleteSelect);
    section.appendChild(autocompleteContainer);
  }

  /**
   * Add color-specific options
   */
  private addColorOptions(section: HTMLElement, field: FieldConfig): void {
    // Default value
    const valueContainer = createContainer('setting-group mb-2');
    const valueLabel = createLabel(this.editor.t('Default Color:'));
    const valueInput = createInputField(
      'color',
      this.editor.t('Select default color'),
      field.options?.value || '#000000',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, value: value },
        })
    );
    valueContainer.appendChild(valueLabel);
    valueContainer.appendChild(valueInput);
    section.appendChild(valueContainer);
  }

  /**
   * Add image-specific options
   */
  private addImageOptions(section: HTMLElement, field: FieldConfig): void {
    // Source
    const srcContainer = createContainer('setting-group mb-2');
    const srcLabel = createLabel(this.editor.t('Image Source:'));
    const srcInput = createInputField(
      'text',
      this.editor.t('Enter image URL'),
      field.options?.src || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, src: value },
        })
    );
    srcContainer.appendChild(srcLabel);
    srcContainer.appendChild(srcInput);
    section.appendChild(srcContainer);

    // Alt text
    const altContainer = createContainer('setting-group mb-2');
    const altLabel = createLabel(this.editor.t('Alt Text:'));
    const altInput = createInputField(
      'text',
      this.editor.t('Enter alt text'),
      field.options?.alt || '',
      (value) =>
        this.onUpdate(field.id, {
          options: { ...field.options, alt: value },
        })
    );
    altContainer.appendChild(altLabel);
    altContainer.appendChild(altInput);
    section.appendChild(altContainer);
  }

  /**
   * Create options list for select/radio fields
   */
  private createOptionsList(field: FieldConfig): HTMLElement {
    const section = createContainer(
      'options-list mb-3 p-3 bg-gray-50 rounded border border-gray-200'
    );
    const title = createContainer('section-title text-sm font-medium mb-2 text-gray-700');

    // Разные заголовки для разных типов полей
    if (field.type === 'checkbox') {
      title.textContent = this.editor.t('Checkbox Options');
    } else if (field.type === 'radio') {
      title.textContent = this.editor.t('Radio Options');
    } else {
      title.textContent = this.editor.t('Options');
    }

    section.appendChild(title);

    const options = field.options?.options || [];

    // Add description
    const description = createContainer('text-xs text-gray-500 mb-2');
    if (field.type === 'checkbox') {
      description.textContent = this.editor.t('Add, edit, or reorder checkbox text options');
    } else if (field.type === 'radio') {
      description.textContent = this.editor.t('Add, edit, or reorder radio button text options');
    } else {
      description.textContent = this.editor.t('Add, edit, or reorder options using buttons');
    }
    section.appendChild(description);

    // Options container
    const optionsContainer = createContainer('options-container space-y-1');
    optionsContainer.setAttribute('data-field-id', field.id);

    if (options.length === 0) {
      const emptyState = createContainer('empty-state text-center py-3 text-gray-400 text-xs');
      emptyState.innerHTML = `📝 ${this.editor.t('No options')}`;
      optionsContainer.appendChild(emptyState);
    } else {
      options.forEach((option, index) => {
        const optionContainer = createContainer(
          'option-item bg-white border border-gray-200 rounded p-2 hover:border-gray-300 transition-colors'
        );

        const optionRow = createContainer('flex items-center gap-2');

        // Option number
        const optionNumber = createContainer(
          'option-number text-xs font-medium text-gray-700 bg-blue-100 text-blue-800 px-2 py-1 rounded min-w-[24px] text-center'
        );
        optionNumber.textContent = `${index + 1}`;

        // Value label - для чекбоксов и radio это текст, для select это значение
        const valueLabel = createContainer('text-xs text-gray-500 min-w-[40px]');
        if (field.type === 'checkbox' || field.type === 'radio') {
          valueLabel.textContent = this.editor.t('Text:');
        } else {
          valueLabel.textContent = this.editor.t('Value:');
        }

        // Option value input - сделаем его более заметным и удобным для редактирования
        const valueInput = createInputField(
          'text',
          field.type === 'checkbox' || field.type === 'radio'
            ? this.editor.t('Enter checkbox text')
            : this.editor.t('Enter option value'),
          option,
          (value) => {
            const newOptions = [...options];
            newOptions[index] = value;
            this.onUpdate(field.id, {
              options: { ...field.options, options: newOptions },
            });
            if (this.onOptionsChange) {
              this.onOptionsChange(field.id);
            }
          }
        );
        valueInput.className =
          'flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';
        valueInput.placeholder =
          field.type === 'checkbox' || field.type === 'radio'
            ? this.editor.t('Checkbox text')
            : this.editor.t('Option value');

        // Для select полей добавляем возможность редактирования display text
        if (field.type === 'select') {
          const displayInput = createInputField(
            'text',
            this.editor.t('Display text (optional)'),
            option, // Пока используем то же значение
            (value) => {
              // В будущем можно добавить отдельное поле для display text
              const newOptions = [...options];
              newOptions[index] = value;
              this.onUpdate(field.id, {
                options: { ...field.options, options: newOptions },
              });
              if (this.onOptionsChange) {
                this.onOptionsChange(field.id);
              }
            }
          );
          displayInput.className =
            'flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white';
          displayInput.placeholder = this.editor.t('Display text');

          // Создаем отдельную строку для display text
          const displayRow = createContainer('flex items-center gap-2 mt-1');
          const displayLabel = createContainer('text-xs text-gray-500 min-w-[60px]');
          displayLabel.textContent = this.editor.t('Display:');
          displayRow.appendChild(displayLabel);
          displayRow.appendChild(displayInput);
          optionContainer.appendChild(displayRow);
        }

        // Action buttons
        const actionsContainer = createContainer('flex gap-1');

        // Move up button
        if (index > 0) {
          const moveUpButton = createButton(
            '↑',
            () => this.moveOption(field.id, index, index - 1),
            'secondary'
          );
          moveUpButton.className =
            'px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors';
          moveUpButton.title = this.editor.t('Move up');
          actionsContainer.appendChild(moveUpButton);
        }

        // Move down button
        if (index < options.length - 1) {
          const moveDownButton = createButton(
            '↓',
            () => this.moveOption(field.id, index, index + 1),
            'secondary'
          );
          moveDownButton.className =
            'px-1.5 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors';
          moveDownButton.title = this.editor.t('Move down');
          actionsContainer.appendChild(moveDownButton);
        }

        // Remove button
        const removeButton = createButton(
          '×',
          () => {
            const newOptions = options.filter((_, i) => i !== index);
            this.onUpdate(field.id, {
              options: { ...field.options, options: newOptions },
            });
            this.editor?.showInfoNotification?.(
              field.type === 'checkbox'
                ? this.editor.t('Checkbox removed')
                : field.type === 'radio'
                  ? this.editor.t('Radio option removed')
                  : this.editor.t('Option removed')
            );
            if (this.onOptionsChange) {
              this.onOptionsChange(field.id);
            }
          },
          'danger'
        );
        removeButton.className =
          'px-1.5 py-0.5 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors';
        removeButton.title = this.editor.t('Remove option');
        actionsContainer.appendChild(removeButton);

        optionRow.appendChild(optionNumber);
        optionRow.appendChild(valueLabel);
        optionRow.appendChild(valueInput);
        optionRow.appendChild(actionsContainer);
        optionContainer.appendChild(optionRow);

        optionsContainer.appendChild(optionContainer);
      });
    }

    section.appendChild(optionsContainer);

    // Action buttons section
    const actionButtonsSection = createContainer('action-buttons mt-2 space-y-1');

    // Add option button
    const addButton = createButton(
      field.type === 'checkbox'
        ? `➕ ${this.editor.t('Add Checkbox')}`
        : field.type === 'radio'
          ? `➕ ${this.editor.t('Add Radio')}`
          : `➕ ${this.editor.t('Add Option')}`,
      () => {
        const defaultText =
          field.type === 'checkbox'
            ? this.editor.t('New Checkbox')
            : field.type === 'radio'
              ? this.editor.t('New Radio')
              : this.editor.t('New Option');

        const newOptions = [...options, defaultText];
        this.onUpdate(field.id, {
          options: { ...field.options, options: newOptions },
        });
        this.editor?.showSuccessNotification?.(
          field.type === 'checkbox'
            ? this.editor.t('Checkbox added successfully')
            : field.type === 'radio'
              ? this.editor.t('Radio option added successfully')
              : this.editor.t('Option added successfully')
        );
        if (this.onOptionsChange) {
          this.onOptionsChange(field.id);
        }
      },
      'primary'
    );
    addButton.className =
      'w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors';

    // Bulk actions
    const bulkActionsContainer = createContainer('bulk-actions flex gap-1');

    const clearAllButton = createButton(
      `🗑️ ${this.editor.t('Clear')}`,
      () => {
        this.onUpdate(field.id, {
          options: { ...field.options, options: [] },
        });
        this.editor?.showInfoNotification?.(this.editor.t('All options cleared'));
        if (this.onOptionsChange) {
          this.onOptionsChange(field.id);
        }
      },
      'danger'
    );
    clearAllButton.className =
      'flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded';

    const addPresetButton = createButton(
      `📋 ${this.editor.t('Presets')}`,
      () => this.showPresetOptions(field),
      'secondary'
    );
    addPresetButton.className =
      'flex-1 py-1 px-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded';

    bulkActionsContainer.appendChild(clearAllButton);
    bulkActionsContainer.appendChild(addPresetButton);

    actionButtonsSection.appendChild(addButton);
    actionButtonsSection.appendChild(bulkActionsContainer);

    section.appendChild(actionButtonsSection);

    return section;
  }

  /**
   * Move option to new position
   */
  private moveOption(fieldId: string, fromIndex: number, toIndex: number): void {
    const field = this.getFieldById(fieldId);
    if (!field || !field.options?.options) return;

    const options = [...field.options.options];
    const [movedOption] = options.splice(fromIndex, 1);
    options.splice(toIndex, 0, movedOption);

    this.onUpdate(fieldId, {
      options: { ...field.options, options },
    });

    this.editor?.showInfoNotification?.(
      field.type === 'checkbox'
        ? this.editor.t('Checkbox moved')
        : field.type === 'radio'
          ? this.editor.t('Radio option moved')
          : this.editor.t('Option moved')
    );

    if (this.onOptionsChange) {
      this.onOptionsChange(fieldId);
    }
  }

  /**
   * Show preset options dialog
   */
  private showPresetOptions(field: FieldConfig): void {
    const presets = {
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
      genders: [this.editor.t('Male'), this.editor.t('Female'), this.editor.t('Other')],
      'yes-no': [this.editor.t('Yes'), this.editor.t('No')],
      custom: [],
    };

    // Create modal for preset selection
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    const modalContent = document.createElement('div');
    modalContent.className =
      'bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden';

    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6';

    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold mb-2';
    title.textContent = this.editor.t('Select Preset Options');

    const subtitle = document.createElement('p');
    subtitle.className = 'text-blue-100 text-sm';
    subtitle.textContent = this.editor.t(
      'Choose from predefined option sets or create custom options'
    );

    modalHeader.appendChild(title);
    modalHeader.appendChild(subtitle);
    modalContent.appendChild(modalHeader);

    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'p-6 max-h-[60vh] overflow-y-auto';

    const presetGrid = document.createElement('div');
    presetGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    Object.entries(presets).forEach(([key, values]) => {
      if (key === 'custom') return; // Skip custom for now

      const presetCard = document.createElement('div');
      presetCard.className =
        'preset-card border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-white';

      const presetIcon = document.createElement('div');
      presetIcon.className = 'text-2xl mb-3';

      // Set appropriate icon for each preset
      const icons: { [key: string]: string } = {
        countries: '🌍',
        months: '📅',
        days: '📆',
        colors: '🎨',
        sizes: '👕',
        'age-groups': '👥',
        genders: '👤',
        'yes-no': '✅',
      };
      presetIcon.textContent = icons[key] || '📋';

      const presetTitle = document.createElement('h4');
      presetTitle.className = 'font-semibold text-gray-800 mb-2';
      presetTitle.textContent = this.editor.t(
        key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' ')
      );

      const presetCount = document.createElement('p');
      presetCount.className = 'text-sm text-gray-600 mb-3';
      presetCount.textContent = `${values.length} ${this.editor.t('options')}`;

      const presetPreview = document.createElement('div');
      presetPreview.className = 'text-xs text-gray-500 bg-gray-50 p-2 rounded border';
      presetPreview.textContent = values.slice(0, 3).join(', ') + (values.length > 3 ? '...' : '');

      presetCard.appendChild(presetIcon);
      presetCard.appendChild(presetTitle);
      presetCard.appendChild(presetCount);
      presetCard.appendChild(presetPreview);

      presetCard.addEventListener('click', () => {
        this.onUpdate(field.id, {
          options: { ...field.options, options: values },
        });

        // Show success notification
        this.editor?.showSuccessNotification?.(
          `${this.editor.t('Applied')} ${values.length} ${this.editor.t('options')}`
        );

        if (this.onOptionsChange) {
          this.onOptionsChange(field.id);
        }

        modal.remove();
      });

      presetCard.addEventListener('mouseenter', () => {
        presetCard.style.transform = 'translateY(-2px)';
      });

      presetCard.addEventListener('mouseleave', () => {
        presetCard.style.transform = 'translateY(0)';
      });

      presetGrid.appendChild(presetCard);
    });

    modalBody.appendChild(presetGrid);
    modalContent.appendChild(modalBody);

    // Modal footer
    const modalFooter = document.createElement('div');
    modalFooter.className = 'bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end';

    const cancelButton = document.createElement('button');
    cancelButton.className =
      'px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 font-medium';
    cancelButton.textContent = this.editor.t('Cancel');
    cancelButton.addEventListener('click', () => modal.remove());

    modalFooter.appendChild(cancelButton);
    modalContent.appendChild(modalFooter);

    modal.appendChild(modalContent);

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Close modal on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    document.body.appendChild(modal);
  }

  /**
   * Get field by ID (helper method)
   */
  private getFieldById(fieldId: string): FieldConfig | null {
    return this.formManager.getField(fieldId) || null;
  }

  /**
   * Get field type options
   */
  private getFieldTypeOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'text', label: this.editor.t('Text Input') },
      { value: 'textarea', label: this.editor.t('Text Area') },
      { value: 'select', label: this.editor.t('Dropdown') },
      { value: 'checkbox', label: this.editor.t('Checkbox') },
      { value: 'radio', label: this.editor.t('Radio Button') },
      { value: 'button', label: this.editor.t('Button') },
      { value: 'file', label: this.editor.t('File Upload') },
      { value: 'date', label: this.editor.t('Date') },
      { value: 'time', label: this.editor.t('Time') },
      { value: 'range', label: this.editor.t('Range') },
      { value: 'email', label: this.editor.t('Email') },
      { value: 'password', label: this.editor.t('Password') },
      { value: 'number', label: this.editor.t('Number') },
      { value: 'tel', label: this.editor.t('Phone') },
      { value: 'url', label: this.editor.t('URL') },
      { value: 'color', label: this.editor.t('Color') },
      { value: 'datetime-local', label: this.editor.t('Date & Time') },
      { value: 'month', label: this.editor.t('Month') },
      { value: 'week', label: this.editor.t('Week') },
      { value: 'hidden', label: this.editor.t('Hidden Field') },
      { value: 'image', label: this.editor.t('Image Button') },
    ];
  }

  /**
   * Create validation settings
   */
  private createValidationSettings(field: FieldConfig): HTMLElement {
    const section = createContainer('validation-settings mb-4');
    const title = createContainer('section-title text-md font-medium mb-2');
    title.textContent = this.editor.t('Validation');
    section.appendChild(title);

    // Required field
    const requiredContainer = createContainer('setting-group mb-3');
    const requiredCheckbox = createCheckbox(
      this.editor.t('Required Field'),
      field.validation?.required || false,
      (checked) =>
        this.onUpdate(field.id, {
          validation: { ...field.validation, required: checked },
        })
    );
    requiredContainer.appendChild(requiredCheckbox);
    section.appendChild(requiredContainer);

    // Validation pattern
    const patternContainer = createContainer('setting-group mb-3');
    const patternLabel = createLabel(this.editor.t('Regular Expression:'));
    const patternInput = createInputField(
      'text',
      this.editor.t('Enter regular expression'),
      field.validation?.pattern || '',
      (value) =>
        this.onUpdate(field.id, {
          validation: { ...field.validation, pattern: value },
        })
    );
    patternContainer.appendChild(patternLabel);
    patternContainer.appendChild(patternInput);
    section.appendChild(patternContainer);

    // Minimum length
    const minLengthContainer = createContainer('setting-group mb-3');
    const minLengthLabel = createLabel(this.editor.t('Minimum Length:'));
    const minLengthInput = createInputField(
      'number',
      this.editor.t('Enter minimum length'),
      field.validation?.minLength?.toString() || '',
      (value) =>
        this.onUpdate(field.id, {
          validation: { ...field.validation, minLength: parseInt(value) || undefined },
        })
    );
    minLengthContainer.appendChild(minLengthLabel);
    minLengthContainer.appendChild(minLengthInput);
    section.appendChild(minLengthContainer);

    // Maximum length
    const maxLengthContainer = createContainer('setting-group mb-3');
    const maxLengthLabel = createLabel(this.editor.t('Maximum Length:'));
    const maxLengthInput = createInputField(
      'number',
      this.editor.t('Enter maximum length'),
      field.validation?.maxLength?.toString() || '',
      (value) =>
        this.onUpdate(field.id, {
          validation: { ...field.validation, maxLength: parseInt(value) || undefined },
        })
    );
    maxLengthContainer.appendChild(maxLengthLabel);
    maxLengthContainer.appendChild(maxLengthInput);
    section.appendChild(maxLengthContainer);

    return section;
  }
}
