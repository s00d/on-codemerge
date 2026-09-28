import { PopupController, foreign, h } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { CalendarManager } from '../services/CalendarManager';
import { CategoryManager } from '../services/CategoryManager';
import type { Calendar, CalendarEvent } from '../types';
import { CalendarForm } from './CalendarForm';
import { EventForm } from './EventForm';

/** Calendar chrome — lists via ViewSpec; forms via foreign + mountInto. */
export class CalendarMenu {
  private readonly popups: PopupController;
  private readonly editor: EditorAPI;
  private readonly manager: CalendarManager;
  private readonly categoryManager: CategoryManager;
  private onSelect: ((calendar: Calendar) => void) | null = null;
  private readonly onImport?: () => void;

  constructor(
    manager: CalendarManager,
    editor: EditorAPI,
    onImport: (() => void) | undefined,
    scope: DisposableScope,
    categoryManager?: CategoryManager
  ) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
    this.manager = manager;
    this.categoryManager = categoryManager ?? new CategoryManager();
    this.onImport = onImport;
  }

  private listView(): ViewSpec {
    const calendars = this.manager.getCalendars();
    if (calendars.length === 0) {
      return h('div', { class: 'empty-state' }, [
        h('p', null, this.editor.t('calendar.noCalendarsFound')),
        h('p', null, this.editor.t('calendar.createYourFirstCalendarToGetStarted')),
      ]);
    }
    return h(
      'div',
      { class: 'calendars-list' },
      ...calendars.map((calendar) => {
        const events = this.manager.getEvents(calendar.id);
        return h(
          'div',
          {
            class: 'calendar-item',
            on: {
              click: () => {
                this.handleSelectCalendar(calendar);
              },
            },
          },
          h('div', { class: 'calendar-info' }, [
            h('h4', { class: 'calendar-title' }, calendar.title),
            h('p', { class: 'calendar-description' }, calendar.description ?? ''),
            h(
              'span',
              { class: 'calendar-events-count' },
              `${events.length} ${this.editor.t('common.events')}`
            ),
          ]),
          h('div', { class: 'calendar-actions' }, [
            h(
              'button',
              {
                class: 'btn-edit',
                attrs: { type: 'button', title: this.editor.t('common.edit') },
                on: {
                  click: (e) => {
                    e.stopPropagation();
                    this.showEditCalendarForm(calendar);
                  },
                },
              },
              this.editor.t('common.edit')
            ),
            h(
              'button',
              {
                class: 'btn-delete',
                attrs: { type: 'button', title: this.editor.t('common.delete') },
                on: {
                  click: (e) => {
                    e.stopPropagation();
                    this.handleDeleteCalendar(calendar);
                  },
                },
              },
              this.editor.t('common.delete')
            ),
          ])
        );
      })
    );
  }

  private openMainPopup(): void {
    this.popups.open({
      title: this.editor.t('calendar.title'),
      className: 'calendar-menu',
      size: 'md',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('common.import'),
          variant: 'secondary',
          onClick: () => {
            this.showImportDialog();
            return true;
          },
        },
        {
          label: this.editor.t('calendar.newCalendar'),
          variant: 'primary',
          onClick: () => {
            this.showNewCalendarForm();
            return true;
          },
        },
      ],
      items: [{ type: 'view', id: 'calendars-content', view: () => this.listView() }],
    });
  }

  private createFormPopup(
    title: string,
    form: CalendarForm | EventForm,
    submitLabel: string,
    onCancel?: () => void
  ): void {
    this.popups.open({
      title: this.editor.t(title) || title,
      className: 'calendar-menu',
      size: 'md',
      closeOnClickOutside: true,
      buttons: [
        {
          label: this.editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {
            onCancel?.();
            return true;
          },
        },
        {
          label: this.editor.t(submitLabel) || submitLabel,
          variant: 'primary',
          onClick: () => {
            form.submit();
            return true;
          },
        },
      ],
      items: [
        {
          type: 'view',
          id: 'form-content',
          view: () =>
            foreign((host, scope) => {
              form.mountInto(host);
              scope.disposable(() => {
                form.destroy();
              });
            }),
        },
      ],
    });
  }

  public showNewCalendarForm(onCalendarCreated?: (calendar: Calendar) => void): void {
    const form = new CalendarForm(this.editor, (data) => {
      const newCalendar = this.manager.createCalendar(data);
      this.popups.close();
      this.openMainPopup();
      onCalendarCreated?.(newCalendar);
    });
    this.createFormPopup('New Calendar', form, 'Create', () => {
      this.openMainPopup();
    });
  }

  public showEditCalendarForm(calendar: Calendar): void {
    const form = new CalendarForm(
      this.editor,
      (data) => {
        this.manager.updateCalendar(calendar.id, data);
        this.popups.close();
        this.openMainPopup();
      },
      calendar
    );
    this.createFormPopup('Edit Calendar', form, 'Update', () => {
      this.openMainPopup();
    });
  }

  private handleSelectCalendar(calendar: Calendar): void {
    this.onSelect?.(calendar);
    this.popups.close();
  }

  private handleDeleteCalendar(calendar: Calendar): void {
    if (confirm(this.editor.t('calendar.areYouSureYouWantToDeleteThisCalendar') || 'Delete?')) {
      this.manager.deleteCalendar(calendar.id);
      this.popups.close();
      this.openMainPopup();
    }
  }

  public show(onSelect: (calendar: Calendar) => void): void {
    this.onSelect = onSelect;
    this.openMainPopup();
  }

  public showEditEvent(event: CalendarEvent, onUpdate: (event: CalendarEvent) => void): void {
    const form = new EventForm(
      this.editor,
      (data) => {
        const updatedEvent = this.manager.updateEvent(event.id, data);
        this.popups.close();
        onUpdate(updatedEvent);
      },
      event,
      this.categoryManager
    );
    this.createFormPopup('Edit Event', form, 'Update');
  }

  public showCreateEvent(calendarId: string, onCreate: (event: CalendarEvent) => void): void {
    const form = new EventForm(
      this.editor,
      (data) => {
        const newEvent = this.manager.createEvent(data, calendarId);
        this.popups.close();
        onCreate(newEvent);
      },
      undefined,
      this.categoryManager
    );
    this.createFormPopup('New Event', form, 'Create');
  }

  public showImportDialog(): void {
    this.onImport?.();
  }
}
