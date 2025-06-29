import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Timer, CreateTimerData } from '../types';
import {
  createForm,
  createInputField,
  createTextarea,
  createContainer,
  createLabel
} from '../../../utils/helpers';

export class TimerForm {
  private editor: HTMLEditor;
  private onSubmit: (data: CreateTimerData) => void;
  private timer?: Timer;
  private titleField?: HTMLInputElement;
  private descriptionField?: HTMLTextAreaElement;
  private dateField?: HTMLInputElement;
  private timeField?: HTMLInputElement;
  private colorField?: HTMLInputElement;
  private categoryField?: HTMLInputElement;
  private tagsField?: HTMLInputElement;

  constructor(
    editor: HTMLEditor,
    onSubmit: (data: CreateTimerData) => void,
    timer?: Timer
  ) {
    this.editor = editor;
    this.onSubmit = onSubmit;
    this.timer = timer;
  }

  public getElement(): HTMLElement {
    const container = createContainer('timer-form-container');

    const form = createForm('timer-form');

    // Название таймера
    const titleLabel = createLabel(this.editor.t('Title'), 'title');
    this.titleField = createInputField(
      'text',
      this.editor.t('Enter timer title'),
      this.timer?.title || ''
    );
    this.titleField.id = 'title';
    this.titleField.required = true;

    // Описание
    const descriptionLabel = createLabel(this.editor.t('Description'), 'description');
    this.descriptionField = createTextarea(
      this.editor.t('Enter timer description'),
      this.timer?.description || ''
    );
    this.descriptionField.id = 'description';

    // Дата
    const dateLabel = createLabel(this.editor.t('Target Date'), 'targetDate');
    this.dateField = createInputField(
      'date',
      '',
      this.timer?.targetDate ? this.formatDateForInput(this.timer.targetDate) : ''
    );
    this.dateField.id = 'targetDate';
    this.dateField.required = true;

    // Время
    const timeLabel = createLabel(this.editor.t('Target Time'), 'targetTime');
    this.timeField = createInputField(
      'time',
      '',
      this.timer?.targetTime || ''
    );
    this.timeField.id = 'targetTime';
    this.timeField.required = true;

    // Цвет
    const colorLabel = createLabel(this.editor.t('Color'), 'color');
    this.colorField = createInputField(
      'color',
      '',
      this.timer?.color || '#3b82f6'
    );
    this.colorField.id = 'color';

    // Категория
    const categoryLabel = createLabel(this.editor.t('Category'), 'category');
    this.categoryField = createInputField(
      'text',
      this.editor.t('Enter category'),
      this.timer?.category || ''
    );
    this.categoryField.id = 'category';

    // Теги
    const tagsLabel = createLabel(this.editor.t('Tags (comma separated)'), 'tags');
    this.tagsField = createInputField(
      'text',
      this.editor.t('Enter tags separated by commas'),
      this.timer?.tags?.join(', ') || ''
    );
    this.tagsField.id = 'tags';

    // Добавляем поля в форму
    form.appendChild(titleLabel);
    form.appendChild(this.titleField);
    form.appendChild(descriptionLabel);
    form.appendChild(this.descriptionField);
    form.appendChild(dateLabel);
    form.appendChild(this.dateField);
    form.appendChild(timeLabel);
    form.appendChild(this.timeField);
    form.appendChild(colorLabel);
    form.appendChild(this.colorField);
    form.appendChild(categoryLabel);
    form.appendChild(this.categoryField);
    form.appendChild(tagsLabel);
    form.appendChild(this.tagsField);

    container.appendChild(form);

    return container;
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  public submit(): void {
    if (!this.titleField || !this.dateField || !this.timeField) return;

    const dateValue = this.dateField.value;
    const timeValue = this.timeField.value;

    // Создаем дату, объединяя дату и время
    let targetDate: Date;
    if (dateValue && timeValue) {
      const dateTimeString = `${dateValue}T${timeValue}`;
      targetDate = new Date(dateTimeString);
    } else {
      targetDate = new Date();
    }

    const data: CreateTimerData = {
      title: this.titleField.value || '',
      description: this.descriptionField?.value || '',
      targetDate: targetDate,
      targetTime: this.timeField.value || '',
      color: this.colorField?.value || '#3b82f6',
      category: this.categoryField?.value || '',
      tags: (this.tagsField?.value || '').split(',').map(tag => tag.trim()).filter(Boolean),
    };

    // Валидация
    if (!data.title.trim()) {
      this.editor.showErrorNotification(this.editor.t('Title is required') || 'Title is required');
      return;
    }

    if (!dateValue) {
      this.editor.showErrorNotification(this.editor.t('Target date is required') || 'Target date is required');
      return;
    }

    if (!timeValue) {
      this.editor.showErrorNotification(this.editor.t('Target time is required') || 'Target time is required');
      return;
    }

    if (isNaN(targetDate.getTime())) {
      this.editor.showErrorNotification(this.editor.t('Invalid date/time format') || 'Invalid date/time format');
      return;
    }

    this.onSubmit(data);
  }

  public destroy(): void {
    this.titleField = null!;
    this.descriptionField = null!;
    this.dateField = null!;
    this.timeField = null!;
    this.colorField = null!;
    this.categoryField = null!;
    this.tagsField = null!;
    this.editor = null!;
    this.onSubmit = null!;
    this.timer = null!;
  }
}
