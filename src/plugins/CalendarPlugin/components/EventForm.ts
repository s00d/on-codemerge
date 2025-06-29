import type { HTMLEditor } from '../../../core/HTMLEditor';
import type { CalendarEvent, CreateEventData } from '../types';
import { 
  createForm, 
  createLabel, 
  createInputField, 
  createTextarea, 
  createCheckbox, 
  createContainer,
  createSelectField,
  createFormSubmitHandler,
  type CalendarEventData 
} from '../../../utils/helpers';

export class EventForm {
  private editor: HTMLEditor;
  private onSubmit: (data: CreateEventData) => void;
  private event?: CalendarEvent;
  private formElement?: HTMLFormElement;
  private categoryManager: any;

  constructor(
    editor: HTMLEditor,
    onSubmit: (data: CreateEventData) => void,
    event?: CalendarEvent,
    categoryManager?: any
  ) {
    this.editor = editor;
    this.onSubmit = onSubmit;
    this.event = event;
    this.categoryManager = categoryManager;
  }

  public getElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'event-form-container';

    // Создаем форму
    this.formElement = createForm('event-form', null, 'POST');
    
    // Заголовок события
    const titleContainer = createContainer('form-group mb-4');
    const titleLabel = createLabel(this.editor.t('Title'), 'event-title');
    const titleInput = createInputField('text', this.editor.t('Enter event title'), this.event?.title || '');
    titleInput.id = 'event-title';
    titleInput.name = 'title';
    titleInput.required = true;
    titleContainer.appendChild(titleLabel);
    titleContainer.appendChild(titleInput);
    this.formElement.appendChild(titleContainer);

    // Описание события
    const descriptionContainer = createContainer('form-group mb-4');
    const descriptionLabel = createLabel(this.editor.t('Description'), 'event-description');
    const descriptionTextarea = createTextarea(this.editor.t('Enter event description'), this.event?.description || '');
    descriptionTextarea.id = 'event-description';
    descriptionTextarea.name = 'description';
    descriptionTextarea.rows = 3;
    descriptionContainer.appendChild(descriptionLabel);
    descriptionContainer.appendChild(descriptionTextarea);
    this.formElement.appendChild(descriptionContainer);

    // Дата и время
    const dateTimeContainer = createContainer('form-row grid grid-cols-2 gap-4 mb-4');
    
    const dateContainer = createContainer('form-group');
    const dateLabel = createLabel(this.editor.t('Date'), 'event-date');
    const dateInput = createInputField('date', '', this.event?.date || '');
    dateInput.id = 'event-date';
    dateInput.name = 'date';
    dateInput.required = true;
    dateContainer.appendChild(dateLabel);
    dateContainer.appendChild(dateInput);
    dateTimeContainer.appendChild(dateContainer);

    const timeContainer = createContainer('form-group');
    const timeLabel = createLabel(this.editor.t('Time'), 'event-time');
    const timeInput = createInputField('time', '', this.event?.time || '');
    timeInput.id = 'event-time';
    timeInput.name = 'time';
    timeInput.required = true;
    timeContainer.appendChild(timeLabel);
    timeContainer.appendChild(timeInput);
    dateTimeContainer.appendChild(timeContainer);
    
    this.formElement.appendChild(dateTimeContainer);

    // Длительность и цвет
    const durationColorContainer = createContainer('form-row grid grid-cols-2 gap-4 mb-4');
    
    const durationContainer = createContainer('form-group');
    const durationLabel = createLabel(this.editor.t('Duration (minutes)'), 'event-duration');
    const durationInput = createInputField('number', '', this.event?.duration?.toString() || '60');
    durationInput.id = 'event-duration';
    durationInput.name = 'duration';
    durationInput.min = '15';
    durationInput.step = '15';
    durationContainer.appendChild(durationLabel);
    durationContainer.appendChild(durationInput);
    durationColorContainer.appendChild(durationContainer);

    const colorContainer = createContainer('form-group');
    const colorLabel = createLabel(this.editor.t('Color'), 'event-color');
    const colorInput = createInputField('color', '', this.event?.color || '#3b82f6');
    colorInput.id = 'event-color';
    colorInput.name = 'color';
    colorContainer.appendChild(colorLabel);
    colorContainer.appendChild(colorInput);
    durationColorContainer.appendChild(colorContainer);
    
    this.formElement.appendChild(durationColorContainer);

    // Приоритет и категория
    const priorityCategoryContainer = createContainer('form-row grid grid-cols-2 gap-4 mb-4');
    
    const priorityContainer = createContainer('form-group');
    const priorityLabel = createLabel(this.editor.t('Priority'), 'event-priority');
    const priorityOptions = [
      { value: 'low', label: this.editor.t('Low') },
      { value: 'medium', label: this.editor.t('Medium') },
      { value: 'high', label: this.editor.t('High') }
    ];
    const prioritySelect = createSelectField(priorityOptions, this.event?.priority || 'medium');
    prioritySelect.id = 'event-priority';
    prioritySelect.name = 'priority';
    priorityContainer.appendChild(priorityLabel);
    priorityContainer.appendChild(prioritySelect);
    priorityCategoryContainer.appendChild(priorityContainer);

    const categoryContainer = createContainer('form-group');
    const categoryLabel = createLabel(this.editor.t('Category'), 'event-category');
    let categoryOptions = [
      { value: '', label: this.editor.t('Select category') }
    ];
    
    if (this.categoryManager) {
      const categories = this.categoryManager.getCategories();
      categoryOptions = categoryOptions.concat(
        categories.map((cat: any) => ({ value: cat.id, label: cat.name }))
      );
    }
    
    const categorySelect = createSelectField(categoryOptions, this.event?.category || '');
    categorySelect.id = 'event-category';
    categorySelect.name = 'category';
    categoryContainer.appendChild(categoryLabel);
    categoryContainer.appendChild(categorySelect);
    priorityCategoryContainer.appendChild(categoryContainer);
    
    this.formElement.appendChild(priorityCategoryContainer);

    // Местоположение
    const locationContainer = createContainer('form-group mb-4');
    const locationLabel = createLabel(this.editor.t('Location'), 'event-location');
    const locationInput = createInputField('text', this.editor.t('Enter event location'), this.event?.location || '');
    locationInput.id = 'event-location';
    locationInput.name = 'location';
    locationContainer.appendChild(locationLabel);
    locationContainer.appendChild(locationInput);
    this.formElement.appendChild(locationContainer);

    // Участники
    const attendeesContainer = createContainer('form-group mb-4');
    const attendeesLabel = createLabel(this.editor.t('Attendees'), 'event-attendees');
    const attendeesInput = createInputField('text', this.editor.t('Enter attendees (comma separated)'), this.event?.attendees?.join(', ') || '');
    attendeesInput.id = 'event-attendees';
    attendeesInput.name = 'attendees';
    attendeesContainer.appendChild(attendeesLabel);
    attendeesContainer.appendChild(attendeesInput);
    this.formElement.appendChild(attendeesContainer);

    // Теги
    const tagsContainer = createContainer('form-group mb-4');
    const tagsLabel = createLabel(this.editor.t('Tags'), 'event-tags');
    const tagsInput = createInputField('text', this.editor.t('Enter tags (comma separated)'), this.event?.tags?.join(', ') || '');
    tagsInput.id = 'event-tags';
    tagsInput.name = 'tags';
    tagsContainer.appendChild(tagsLabel);
    tagsContainer.appendChild(tagsInput);
    this.formElement.appendChild(tagsContainer);

    // Напоминание
    const reminderContainer = createContainer('form-group mb-4');
    const reminderLabel = createLabel(this.editor.t('Reminder (minutes before)'), 'event-reminder');
    const reminderInput = createInputField('number', '', this.event?.reminder?.toString() || '');
    reminderInput.id = 'event-reminder';
    reminderInput.name = 'reminder';
    reminderInput.min = '0';
    reminderInput.placeholder = this.editor.t('No reminder');
    reminderContainer.appendChild(reminderLabel);
    reminderContainer.appendChild(reminderInput);
    this.formElement.appendChild(reminderContainer);

    // Весь день
    const allDayContainer = createContainer('form-group mb-4');
    const allDayCheckbox = createCheckbox(this.editor.t('All day event'), this.event?.isAllDay || false);
    const allDayInput = allDayCheckbox.querySelector('input') as HTMLInputElement;
    allDayInput.id = 'event-all-day';
    allDayInput.name = 'isAllDay';
    allDayContainer.appendChild(allDayCheckbox);
    this.formElement.appendChild(allDayContainer);

    // Обработчик отправки
    this.formElement.addEventListener('submit', createFormSubmitHandler(this.formElement, (data) => {
      const eventData: CreateEventData = {
        title: data.title as string,
        description: data.description as string,
        date: data.date as string,
        time: data.time as string,
        duration: data.duration as number,
        location: data.location as string,
        color: data.color as string,
        isAllDay: data.isAllDay as boolean,
        priority: data.priority as 'low' | 'medium' | 'high',
        category: data.category as string,
        tags: data.tags ? (data.tags as string).split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        attendees: data.attendees ? (data.attendees as string).split(',').map(attendee => attendee.trim()).filter(attendee => attendee) : [],
        reminder: data.reminder ? parseInt(data.reminder as string) : undefined,
      };
      this.onSubmit(eventData);
    }));

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