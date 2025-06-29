import type { CalendarEvent, Reminder } from '../types';
import type { CalendarManager } from './CalendarManager';

export class ReminderService {
  private remindersKey = 'html-editor-calendar-reminders';
  private checkInterval: number | null = null;
  private calendarManager: CalendarManager | null = null;

  constructor(calendarManager?: CalendarManager) {
    this.calendarManager = calendarManager || null;
    this.startReminderCheck();
  }

  // Установка ссылки на CalendarManager
  public setCalendarManager(calendarManager: CalendarManager): void {
    this.calendarManager = calendarManager;
  }

  // Создание напоминания
  public createReminder(event: CalendarEvent, calendarId: string): Reminder {
    if (!event.reminder) {
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
    return stored ? JSON.parse(stored) : [];
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
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(() => {
      this.checkReminders();
    }, 60000); // Проверка каждую минуту
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
    // Помечаем как показанное
    const reminders = this.getReminders();
    const index = reminders.findIndex((r) => r.id === reminder.id);
    if (index !== -1) {
      reminders[index].isShown = true;
      localStorage.setItem(this.remindersKey, JSON.stringify(reminders));
    }

    // Создаем HTML для напоминания
    const reminderHtml = this.generateReminderHTML(reminder);

    // Добавляем в DOM
    this.insertReminderHTML(reminderHtml, reminder.id);
  }

  // Генерация HTML кода для напоминания
  public generateReminderHTML(reminder: Reminder): string {
    const event = this.getEventById(reminder.eventId);
    if (!event) return '';

    const priorityClass = event.priority || 'medium';
    const categoryColor = event.color || '#3b82f6';
    const tagsHtml =
      event.tags && event.tags.length > 0
        ? `<div class="event-tags">${event.tags.map((tag) => `<span class="event-tag">${tag}</span>`).join('')}</div>`
        : '';

    return `
      <div class="calendar-reminder" data-reminder-id="${reminder.id}" data-event-id="${reminder.eventId}">
        <div class="reminder-header">
          <div class="reminder-icon">⏰</div>
          <div class="reminder-title">Event Reminder</div>
          <button class="reminder-close" onclick="this.closest('.calendar-reminder').remove()">×</button>
        </div>
        <div class="reminder-content">
          <div class="reminder-event-title">${event.title}</div>
          <div class="reminder-event-time">${event.date} at ${event.time}</div>
          ${event.location ? `<div class="reminder-event-location">📍 ${event.location}</div>` : ''}
          ${event.description ? `<div class="reminder-event-description">${event.description}</div>` : ''}
          ${tagsHtml}
        </div>
        <div class="reminder-footer">
          <div class="reminder-priority priority-${priorityClass}">${priorityClass.toUpperCase()}</div>
          <div class="reminder-category" style="background-color: ${categoryColor}">${event.category || 'General'}</div>
        </div>
      </div>
    `;
  }

  // Вставка HTML напоминания в DOM
  private insertReminderHTML(html: string, _reminderId: string): void {
    // Создаем контейнер для напоминаний, если его нет
    let container = document.querySelector('.calendar-reminders-container') as HTMLDivElement;
    if (!container) {
      container = document.createElement('div') as HTMLDivElement;
      container.className = 'calendar-reminders-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    // Создаем элемент напоминания
    const reminderElement = document.createElement('div');
    reminderElement.innerHTML = html;
    const reminderNode = reminderElement.firstElementChild;

    if (reminderNode) {
      container.appendChild(reminderNode);

      // Автоматическое удаление через 30 секунд
      setTimeout(() => {
        if (reminderNode.parentNode) {
          reminderNode.parentNode.removeChild(reminderNode);
        }
      }, 30000);
    }
  }

  // Генерация JavaScript кода для клиента
  public generateReminderScript(calendarId: string): string {
    const reminders = this.getReminders().filter((r) => r.calendarId === calendarId);

    if (reminders.length === 0) return '';

    const reminderData = reminders.map((reminder) => ({
      id: reminder.id,
      eventId: reminder.eventId,
      triggerTime: reminder.triggerTime,
      message: reminder.message,
    }));

    return `
      <script>
        (function() {
          const reminderData = ${JSON.stringify(reminderData)};
          const now = Date.now();
          
          function showReminder(reminder) {
            const reminderHtml = \`
              <div class="calendar-reminder" data-reminder-id="\${reminder.id}">
                <div class="reminder-header">
                  <div class="reminder-icon">⏰</div>
                  <div class="reminder-title">Event Reminder</div>
                  <button class="reminder-close" onclick="this.closest('.calendar-reminder').remove()">×</button>
                </div>
                <div class="reminder-content">
                  <div class="reminder-message">\${reminder.message}</div>
                </div>
              </div>
            \`;
            
            let container = document.querySelector('.calendar-reminders-container');
            if (!container) {
              container = document.createElement('div');
              container.className = 'calendar-reminders-container';
              container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;';
              document.body.appendChild(container);
            }
            
            const reminderElement = document.createElement('div');
            reminderElement.innerHTML = reminderHtml;
            container.appendChild(reminderElement.firstElementChild);
            
            setTimeout(() => {
              const reminder = document.querySelector(\`[data-reminder-id="\${reminder.id}"]\`);
              if (reminder && reminder.parentNode) {
                reminder.parentNode.removeChild(reminder);
              }
            }, 30000);
          }
          
          function checkReminders() {
            reminderData.forEach(reminder => {
              if (reminder.triggerTime <= now) {
                showReminder(reminder);
              }
            });
          }
          
          // Проверяем сразу
          checkReminders();
          
          // Проверяем каждую минуту
          setInterval(checkReminders, 60000);
        })();
      </script>
    `;
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
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
