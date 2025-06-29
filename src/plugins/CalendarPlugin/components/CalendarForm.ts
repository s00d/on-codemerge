import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { Calendar, CreateCalendarData } from '../types';
import {
  createForm,
  createLabel,
  createInputField,
  createTextarea,
  createContainer,
  createFormSubmitHandler,
} from '../../../utils/helpers';

export class CalendarForm {
  private editor: HTMLEditor;
  private onSubmit: (data: CreateCalendarData) => void;
  private calendar?: Calendar;
  private formElement?: HTMLFormElement;

  constructor(
    editor: HTMLEditor,
    onSubmit: (data: CreateCalendarData) => void,
    calendar?: Calendar
  ) {
    this.editor = editor;
    this.onSubmit = onSubmit;
    this.calendar = calendar;
  }

  public getElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'calendar-form-container';

    // Создаем форму
    this.formElement = createForm('calendar-form', null, 'POST');

    // Название календаря
    const titleContainer = createContainer('form-group mb-4');
    const titleLabel = createLabel(this.editor.t('Calendar Title'), 'calendar-title');
    const titleInput = createInputField(
      'text',
      this.editor.t('Enter calendar title'),
      this.calendar?.title || ''
    );
    titleInput.id = 'calendar-title';
    titleInput.name = 'title';
    titleInput.required = true;
    titleContainer.appendChild(titleLabel);
    titleContainer.appendChild(titleInput);
    this.formElement.appendChild(titleContainer);

    // Описание календаря
    const descriptionContainer = createContainer('form-group mb-4');
    const descriptionLabel = createLabel(this.editor.t('Description'), 'calendar-description');
    const descriptionTextarea = createTextarea(
      this.editor.t('Enter calendar description'),
      this.calendar?.description || ''
    );
    descriptionTextarea.id = 'calendar-description';
    descriptionTextarea.name = 'description';
    descriptionTextarea.rows = 3;
    descriptionContainer.appendChild(descriptionLabel);
    descriptionContainer.appendChild(descriptionTextarea);
    this.formElement.appendChild(descriptionContainer);

    // Обработчик отправки
    this.formElement.addEventListener(
      'submit',
      createFormSubmitHandler(this.formElement, (data) => {
        this.onSubmit({
          title: data.title as string,
          description: data.description as string,
        });
      })
    );

    container.appendChild(this.formElement);
    return container;
  }

  public submit(): boolean {
    if (!this.formElement) return false;

    // Создаем событие submit для валидации и отправки
    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });

    this.formElement.dispatchEvent(submitEvent);
    return true;
  }
}
