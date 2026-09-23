import type { CalendarEvent, Reminder } from '../types';
import type { CalendarManager } from './CalendarManager';
import { h, renderDetached } from '@on-codemerge/sdk';
import { parseJson } from '../../../utils/asAttr';

export class ReminderService {
  private readonly remindersKey = 'html-editor-calendar-reminders';
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private calendarManager: CalendarManager | null = null;

  constructor(calendarManager?: CalendarManager) {
    this.calendarManager = calendarManager ?? null;
    this.startReminderCheck();
  }

  // Установка ссылки на CalendarManager
  public setCalendarManager(calendarManager: CalendarManager): void {
    this.calendarManager = calendarManager;
  }

  // Создание напоминания
  public createReminder(event: CalendarEvent, calendarId: string): Reminder {
    if (event.reminder === null || event.reminder === undefined) {
      throw new Error('Event has no reminder set');
    }

    const eventDate = new Date(`${event.date}T${event.time}`);
    const triggerTime = eventDate.getTime() - event.reminder * 60 * 1000;

    const reminder: Reminder = {
      id: crypto.randomUUID(),
      eventId: event.id,
      calendarId,
      triggerTime,
      message: `Reminder: ${event.title} starts in ${event.reminder} minutes`,
      isShown: false,
      createdAt: Date.now(),
    };

    const reminders = this.getReminders();
    reminders.push(reminder);
    localStorage.setItem(this.remindersKey, JSON.stringify(reminders));

    return reminder;
  }

  // Получение всех напоминаний
  public getReminders(): Reminder[] {
    const stored = localStorage.getItem(this.remindersKey);
    if (stored === null || stored === undefined || stored === '') {
      return [];
    }
    const parsed = parseJson(stored);
    return Array.isArray(parsed) ? (parsed as Reminder[]) : [];
  }

  // Получение напоминаний для события
  public getEventReminders(eventId: string): Reminder[] {
    return this.getReminders().filter((reminder) => reminder.eventId === eventId);
  }

  // Удаление напоминания
  public deleteReminder(id: string): void {
    const reminders = this.getReminders().filter((reminder) => reminder.id !== id);
    localStorage.setItem(this.remindersKey, JSON.stringify(reminders));
  }

  // Удаление всех напоминаний события
  public deleteEventReminders(eventId: string): void {
    const reminders = this.getReminders().filter((reminder) => reminder.eventId !== eventId);
    localStorage.setItem(this.remindersKey, JSON.stringify(reminders));
  }

  // Проверка напоминаний
  private startReminderCheck(): void {
    if (this.checkInterval !== null && this.checkInterval !== undefined) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = globalThis.setInterval(() => {
      this.checkReminders();
    }, 60_000); // Проверка каждую минуту
  }

  private checkReminders(): void {
    const now = Date.now();
    const reminders = this.getReminders();
    const dueReminders = reminders.filter(
      (reminder) => reminder.triggerTime <= now && !reminder.isShown
    );

    dueReminders.forEach((reminder) => {
      this.showReminder(reminder);
    });
  }

  // Показать напоминание
  private showReminder(reminder: Reminder): void {
    const reminders = this.getReminders();
    const index = reminders.findIndex((r) => r.id === reminder.id);
    if (index !== -1) {
      reminders[index].isShown = true;
      localStorage.setItem(this.remindersKey, JSON.stringify(reminders));
    }

    const event = this.getEventById(reminder.eventId);
    if (!event) {
      return;
    }

    const priorityClass = event.priority ?? 'medium';
    const categoryColor = event.color ?? '#3b82f6';
    let toastEl: HTMLElement | null = null;

    const { el, destroy } = renderDetached(
      h(
        'div',
        {
          class: 'calendar-reminder',
          attrs: {
            'data-reminder-id': reminder.id,
            'data-event-id': reminder.eventId,
          },
        },
        [
          h('div', { class: 'reminder-header' }, [
            h('div', { class: 'reminder-icon' }, '⏰'),
            h('div', { class: 'reminder-title' }, 'Event Reminder'),
            h(
              'button',
              {
                class: 'reminder-close',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    toastEl?.remove();
                    destroy();
                  },
                },
              },
              '×'
            ),
          ]),
          h('div', { class: 'reminder-content' }, [
            h('div', { class: 'reminder-event-title' }, event.title),
            h('div', { class: 'reminder-event-time' }, `${event.date} at ${event.time}`),
            event.location
              ? h('div', { class: 'reminder-event-location' }, `📍 ${event.location}`)
              : null,
            event.description
              ? h('div', { class: 'reminder-event-description' }, event.description)
              : null,
            event.tags && event.tags.length > 0
              ? h(
                  'div',
                  { class: 'event-tags' },
                  event.tags.map((tag) => h('span', { class: 'event-tag' }, tag))
                )
              : null,
          ]),
          h('div', { class: 'reminder-footer' }, [
            h(
              'div',
              { class: `reminder-priority priority-${priorityClass}` },
              priorityClass.toUpperCase()
            ),
            h(
              'div',
              {
                class: 'reminder-category',
                style: { backgroundColor: categoryColor },
              },
              event.category ?? 'General'
            ),
          ]),
        ]
      )
    );
    toastEl = el;

    let container = document.querySelector('.calendar-reminders-container');
    if (!container) {
      const built = renderDetached(
        h('div', {
          class: 'calendar-reminders-container',
          style: {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10000',
            maxWidth: '400px',
            pointerEvents: 'none',
          },
        })
      );
      container = built.el;
      document.body.append(container);
    }
    container.append(el);
    globalThis.setTimeout(() => {
      el.remove();
      destroy();
    }, 30_000);
  }

  /** Reminder payloads for published `calendar-reminders` runtime. */
  public getPublishReminders(calendarId: string): {
    id: string;
    triggerTime: number;
    message: string;
  }[] {
    return this.getReminders()
      .filter((r) => r.calendarId === calendarId && !r.isShown)
      .map((r) => ({
        id: r.id,
        triggerTime: r.triggerTime,
        message: r.message,
      }));
  }

  // Получение события по ID из CalendarManager
  private getEventById(eventId: string): CalendarEvent | null {
    if (!this.calendarManager) {
      console.warn('CalendarManager not set in ReminderService');
      return null;
    }
    return this.calendarManager.getEvent(eventId);
  }

  // Очистка ресурсов
  public destroy(): void {
    if (this.checkInterval !== null && this.checkInterval !== undefined) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
