import { PopupManager } from '../../../core/ui/PopupManager';
import type { CalendarManager } from '../services/CalendarManager';
import { CategoryManager } from '../services';
import type { Calendar, CalendarEvent } from '../types';
import { CalendarForm } from './CalendarForm';
import { EventForm } from './EventForm';
import type { HTMLEditor } from '../../../core/HTMLEditor';

export class CalendarMenu {
  private popup: PopupManager;
  private editor: HTMLEditor;
  private manager: CalendarManager;
  private categoryManager: CategoryManager;
  private onSelect: ((calendar: Calendar) => void) | null = null;
  private onImport?: () => void;

  constructor(
    manager: CalendarManager,
    editor: HTMLEditor,
    onImport?: () => void,
    categoryManager?: CategoryManager
  ) {
    this.editor = editor;
    this.manager = manager;
    this.categoryManager = categoryManager || new CategoryManager();
    this.onImport = onImport;
    this.popup = this.createMainPopup();
  }

  private createMainPopup(): PopupManager {
    return new PopupManager(this.editor, {
      title: this.editor.t('Calendar'),
      className: 'calendar-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Import'),
          variant: 'secondary',
          onClick: () => this.showImportDialog(),
        },
        {
          label: this.editor.t('New Calendar'),
          variant: 'primary',
          onClick: () => this.showNewCalendarForm(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'calendars-content',
          content: () => this.createCalendarsList(),
        },
      ],
    });
  }

  private createCalendarsList(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'calendars-list';

    const calendars = this.manager.getCalendars();

    if (calendars.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <p>${this.editor.t('No calendars found')}</p>
        <p>${this.editor.t('Create your first calendar to get started')}</p>
      `;
      container.appendChild(emptyState);
    } else {
      calendars.forEach((calendar) => {
        const calendarItem = this.createCalendarItem(calendar);
        container.appendChild(calendarItem);
      });
    }

    return container;
  }

  private createCalendarItem(calendar: Calendar): HTMLElement {
    const events = this.manager.getEvents(calendar.id);
    const item = document.createElement('div');
    item.className = 'calendar-item';
    item.innerHTML = `
      <div class="calendar-info">
        <h4 class="calendar-title">${calendar.title}</h4>
        <p class="calendar-description">${calendar.description || ''}</p>
        <span class="calendar-events-count">${events.length} events</span>
      </div>
      <div class="calendar-actions">
        <button class="btn-edit" title="${this.editor.t('Edit')}">✏️</button>
        <button class="btn-delete" title="${this.editor.t('Delete')}">🗑️</button>
      </div>
    `;

    // Обработчики событий
    item.addEventListener('click', (e) => {
      if ((e.target as Element).classList.contains('btn-edit')) {
        e.stopPropagation();
        this.showEditCalendarForm(calendar);
      } else if ((e.target as Element).classList.contains('btn-delete')) {
        e.stopPropagation();
        this.handleDeleteCalendar(calendar);
      } else {
        this.handleSelectCalendar(calendar);
      }
    });

    return item;
  }

  private createFormPopup(
    title: string,
    form: CalendarForm | EventForm,
    submitLabel: string,
    onCancel?: () => void
  ): void {
    this.popup = new PopupManager(this.editor, {
      title: this.editor.t(title),
      className: 'calendar-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('Cancel'),
          variant: 'secondary',
          onClick: onCancel || (() => this.popup.hide()),
        },
        {
          label: this.editor.t(submitLabel),
          variant: 'primary',
          onClick: () => {
            this.editor!.ensureEditorFocus();
            form.submit();
          },
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'form-content',
          content: () => form.getElement(),
        },
      ],
    });

    this.popup.show();
  }

  public showNewCalendarForm(onCalendarCreated?: (calendar: Calendar) => void): void {
    const form = new CalendarForm(this.editor, (data) => {
      const newCalendar = this.manager.createCalendar(data);
      this.popup.hide();
      this.popup = this.createMainPopup();
      this.popup.show();

      if (onCalendarCreated && newCalendar) {
        onCalendarCreated(newCalendar);
      }
    });

    this.createFormPopup('New Calendar', form, 'Create', () => {
      this.popup = this.createMainPopup();
      this.popup.show();
    });
  }

  public showEditCalendarForm(calendar: Calendar): void {
    const form = new CalendarForm(
      this.editor,
      (data) => {
        this.manager.updateCalendar(calendar.id, data);
        this.popup.hide();
        this.popup = this.createMainPopup();
        this.popup.show();
      },
      calendar
    );

    this.createFormPopup('Edit Calendar', form, 'Update', () => {
      this.popup = this.createMainPopup();
      this.popup.show();
    });
  }

  private handleSelectCalendar(calendar: Calendar): void {
    this.onSelect?.(calendar);
    this.popup.hide();
  }

  private handleDeleteCalendar(calendar: Calendar): void {
    if (confirm(this.editor.t('Are you sure you want to delete this calendar?'))) {
      this.manager.deleteCalendar(calendar.id);
      this.popup.hide();
      this.popup = this.createMainPopup();
      this.popup.show();
    }
  }

  public show(onSelect: (calendar: Calendar) => void): void {
    this.onSelect = onSelect;
    this.popup.show();
  }

  public showEditEvent(event: CalendarEvent, onUpdate: (event: CalendarEvent) => void): void {
    const form = new EventForm(
      this.editor,
      (data) => {
        const updatedEvent = this.manager.updateEvent(event.id, data);
        this.popup.hide();
        onUpdate(updatedEvent);
      },
      event,
      this.categoryManager
    );

    this.createFormPopup('Edit Event', form, 'Update', () => {
      this.popup.hide();
    });
  }

  public showCreateEvent(calendarId: string, onCreate: (event: CalendarEvent) => void): void {
    const form = new EventForm(
      this.editor,
      (data) => {
        const newEvent = this.manager.createEvent(data, calendarId);
        this.popup.hide();
        onCreate(newEvent);
      },
      undefined,
      this.categoryManager
    );

    this.createFormPopup('New Event', form, 'Create', () => {
      this.popup.hide();
    });
  }

  public showImportDialog(): void {
    if (this.onImport) {
      this.onImport();
    }
  }

  public destroy(): void {
    if (this.popup) {
      this.popup.hide();
      if (typeof this.popup.destroy === 'function') {
        this.popup.destroy();
      }
      this.popup = null!;
    }

    this.editor = null!;
    this.manager = null!;
    this.onSelect = null;
  }
}
