import type {
  Calendar,
  CalendarEvent,
  CreateCalendarData,
  CreateEventData,
  UpdateCalendarData,
  UpdateEventData,
} from '../types';
import { CategoryManager } from './CategoryManager';
import { ReminderService } from './ReminderService';

export class CalendarManager {
  private calendarsKey = 'html-editor-calendars';
  private eventsKey = 'html-editor-calendar-events';
  private categoryManager: CategoryManager;
  private reminderService: ReminderService;

  constructor() {
    this.categoryManager = new CategoryManager();
    this.reminderService = new ReminderService(this);
  }

  public getCalendars(): Calendar[] {
    const stored = localStorage.getItem(this.calendarsKey);
    return stored ? JSON.parse(stored) : [];
  }

  public getCalendar(id: string): Calendar | null {
    const calendars = this.getCalendars();
    return calendars.find((cal) => cal.id === id) || null;
  }

  public createCalendar(data: CreateCalendarData): Calendar {
    const calendars = this.getCalendars();
    const newCalendar: Calendar = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      events: data.events ? data.events.map((event) => this.createEvent(event)) : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    calendars.push(newCalendar);
    localStorage.setItem(this.calendarsKey, JSON.stringify(calendars));
    return newCalendar;
  }

  public updateCalendar(id: string, data: UpdateCalendarData): Calendar {
    const calendars = this.getCalendars();
    const index = calendars.findIndex((cal) => cal.id === id);

    if (index === -1) {
      throw new Error('Calendar not found');
    }

    const { events, ...otherData } = data;
    const updated: Calendar = {
      ...calendars[index],
      ...otherData,
      events: events ? events.map((event) => this.createEvent(event, id)) : calendars[index].events,
      updatedAt: Date.now(),
    };

    calendars[index] = updated;
    localStorage.setItem(this.calendarsKey, JSON.stringify(calendars));
    return updated;
  }

  public deleteCalendar(id: string): void {
    const calendars = this.getCalendars().filter((cal) => cal.id !== id);
    localStorage.setItem(this.calendarsKey, JSON.stringify(calendars));

    // Удаляем все напоминания календаря
    this.reminderService.deleteEventReminders(id);
  }

  public getEvents(calendarId: string): CalendarEvent[] {
    const allEvents = this.getAllEvents();
    return allEvents.filter((event) => event.calendarId === calendarId);
  }

  public getEvent(id: string): CalendarEvent | null {
    const allEvents = this.getAllEvents();
    return allEvents.find((event) => event.id === id) || null;
  }

  public createEvent(data: CreateEventData, calendarId?: string): CalendarEvent {
    const allEvents = this.getAllEvents();
    const newEvent: CalendarEvent & { calendarId: string } = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      duration: data.duration,
      location: data.location,
      color: data.color,
      isAllDay: data.isAllDay,
      priority: data.priority || 'medium',
      category: data.category,
      tags: data.tags || [],
      attendees: data.attendees || [],
      reminder: data.reminder,
      recurring: data.recurring,
      attachments: data.attachments || [],
      calendarId: calendarId || 'default',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    allEvents.push(newEvent);
    localStorage.setItem(this.eventsKey, JSON.stringify(allEvents));

    // Создаем напоминание, если указано
    if (newEvent.reminder && calendarId) {
      this.reminderService.createReminder(newEvent, calendarId);
    }

    return newEvent;
  }

  public updateEvent(id: string, data: UpdateEventData): CalendarEvent {
    const allEvents = this.getAllEvents();
    const index = allEvents.findIndex((event) => event.id === id);

    if (index === -1) {
      throw new Error('Event not found');
    }

    const oldEvent = allEvents[index];
    const updated: CalendarEvent & { calendarId: string } = {
      ...oldEvent,
      ...data,
      updatedAt: Date.now(),
    };

    allEvents[index] = updated;
    localStorage.setItem(this.eventsKey, JSON.stringify(allEvents));

    // Обновляем напоминание, если изменилось
    if (data.reminder !== undefined && oldEvent.reminder !== data.reminder) {
      this.reminderService.deleteEventReminders(id);
      if (data.reminder && updated.calendarId) {
        this.reminderService.createReminder(updated, updated.calendarId);
      }
    }

    return updated;
  }

  public deleteEvent(id: string): void {
    const allEvents = this.getAllEvents().filter((event) => event.id !== id);
    localStorage.setItem(this.eventsKey, JSON.stringify(allEvents));

    // Удаляем напоминания события
    this.reminderService.deleteEventReminders(id);
  }

  public getEventsByDate(date: string): CalendarEvent[] {
    const allEvents = this.getAllEvents();
    return allEvents.filter((event) => event.date === date);
  }

  public getEventsByDateRange(startDate: string, endDate: string): CalendarEvent[] {
    const allEvents = this.getAllEvents();
    return allEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return eventDate >= start && eventDate <= end;
    });
  }

  // Новые методы для работы с категориями и тегами
  public getEventsByCategory(categoryId: string): CalendarEvent[] {
    const allEvents = this.getAllEvents();
    return allEvents.filter((event) => event.category === categoryId);
  }

  public getEventsByTag(tagName: string): CalendarEvent[] {
    const allEvents = this.getAllEvents();
    return allEvents.filter((event) => event.tags?.includes(tagName));
  }

  public getEventsByPriority(priority: 'low' | 'medium' | 'high'): CalendarEvent[] {
    const allEvents = this.getAllEvents();
    return allEvents.filter((event) => event.priority === priority);
  }

  public searchEvents(query: string): CalendarEvent[] {
    const allEvents = this.getAllEvents();
    const lowerQuery = query.toLowerCase();

    return allEvents.filter(
      (event) =>
        event.title.toLowerCase().includes(lowerQuery) ||
        event.description?.toLowerCase().includes(lowerQuery) ||
        event.location?.toLowerCase().includes(lowerQuery) ||
        event.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Методы для работы с категориями и тегами
  public getCategoryManager(): CategoryManager {
    return this.categoryManager;
  }

  public getReminderService(): ReminderService {
    return this.reminderService;
  }

  // Генерация HTML с напоминаниями
  public generateCalendarHTMLWithReminders(calendarId: string): string {
    const calendar = this.getCalendar(calendarId);
    if (!calendar) return '';

    const reminderScript = this.reminderService.generateReminderScript(calendarId);

    return `
      ${this.generateCalendarHTML(calendar)}
      ${reminderScript}
    `;
  }

  // Генерация HTML календаря
  public generateCalendarHTML(calendar: Calendar): string {
    const events = this.getEvents(calendar.id);

    // Сортируем события по дате и времени
    const sortedEvents = events.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    const eventsHtml = sortedEvents.map((event) => this.generateEventHTML(event)).join('');

    return `
      <div class="calendar-widget" data-calendar-id="${calendar.id}">
        <div class="calendar-header">
          <h3 class="calendar-title">${calendar.title}</h3>
        </div>
        <div class="calendar-body">
          <div class="calendar-events">
            ${eventsHtml}
          </div>
        </div>
      </div>
    `;
  }

  // Генерация HTML события
  private generateEventHTML(event: CalendarEvent): string {
    const priorityClass = event.priority || 'medium';
    const categoryColor = event.color || '#3b82f6';
    const categoryName = event.category || 'General';

    // Форматируем дату
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const tagsHtml =
      event.tags && event.tags.length > 0
        ? `<div class="event-tags">${event.tags.map((tag) => `<span class="event-tag">${tag}</span>`).join('')}</div>`
        : '';

    const attendeesHtml =
      event.attendees && event.attendees.length > 0
        ? `<span class="event-attendees">👥 ${event.attendees.join(', ')}</span>`
        : '';

    const reminderHtml = event.reminder
      ? `<span class="event-reminder">⏰ ${event.reminder}</span>`
      : '';

    const locationHtml = event.location
      ? `<span class="event-location">📍 ${event.location}</span>`
      : '';

    const durationHtml = event.duration
      ? `<span class="event-duration">⏱️ ${event.duration} min</span>`
      : '';

    const metaInfo = [locationHtml, durationHtml, attendeesHtml, reminderHtml]
      .filter(Boolean)
      .join(' • ');

    return `
      <div class="calendar-event" data-event-id="${event.id}" style="--event-color: ${event.color || '#3b82f6'}">
        <div class="event-header">
          <div class="event-datetime">
            <div class="event-date">${formattedDate}</div>
            <div class="event-time">${event.time}</div>
          </div>
          <div class="event-priority priority-${priorityClass}">${priorityClass.toUpperCase()}</div>
        </div>
        <div class="event-title">${event.title}</div>
        ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
        <div class="event-meta">
          <div class="event-category" style="background-color: ${categoryColor}">${categoryName}</div>
          ${metaInfo ? `<div class="event-meta-info">${metaInfo}</div>` : ''}
        </div>
        ${tagsHtml}
      </div>
    `;
  }

  private getAllEvents(): (CalendarEvent & { calendarId: string })[] {
    const stored = localStorage.getItem(this.eventsKey);
    return stored ? JSON.parse(stored) : [];
  }

  public exportCalendar(id: string): string {
    const calendar = this.getCalendar(id);
    if (!calendar) {
      throw new Error('Calendar not found');
    }

    const events = this.getEvents(id);
    const exportData = {
      calendar,
      events,
      categories: this.categoryManager.getCategories(),
      tags: this.categoryManager.getTags(),
      exportDate: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  public importCalendar(data: string): Calendar {
    try {
      const importData = JSON.parse(data);
      const calendar = importData.calendar;
      const events = importData.events || [];
      const categories = importData.categories || [];
      const tags = importData.tags || [];

      // Импортируем категории и теги
      categories.forEach((cat: any) => {
        this.categoryManager.createCategory(cat.name, cat.color);
      });

      tags.forEach((tag: any) => {
        this.categoryManager.createTag(tag.name, tag.color);
      });

      const newCalendar = this.createCalendar({
        title: calendar.title,
        description: calendar.description,
      });

      events.forEach((eventData: any) => {
        this.createEvent(eventData, newCalendar.id);
      });

      return newCalendar;
    } catch (error) {
      throw new Error('Invalid calendar data format');
    }
  }

  public copyCalendar(id: string): Calendar {
    const originalCalendar = this.getCalendar(id);
    if (!originalCalendar) {
      throw new Error('Calendar not found');
    }

    const events = this.getEvents(id);
    const newCalendar = this.createCalendar({
      title: `${originalCalendar.title} (Copy)`,
      description: originalCalendar.description,
    });

    // Копируем события
    events.forEach((event) => {
      this.createEvent(
        {
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          duration: event.duration,
          location: event.location,
          color: event.color,
          isAllDay: event.isAllDay,
          priority: event.priority,
          category: event.category,
          tags: event.tags,
          attendees: event.attendees,
          reminder: event.reminder,
          recurring: event.recurring,
          attachments: event.attachments,
        },
        newCalendar.id
      );
    });

    return newCalendar;
  }

  public copyEvent(id: string): CalendarEvent {
    const originalEvent = this.getEvent(id);
    if (!originalEvent) {
      throw new Error('Event not found');
    }

    const allEvents = this.getAllEvents();
    const eventWithCalendar = allEvents.find((e) => e.id === id);
    if (!eventWithCalendar) {
      throw new Error('Event calendar not found');
    }

    return this.createEvent(
      {
        title: `${originalEvent.title} (Copy)`,
        description: originalEvent.description,
        date: originalEvent.date,
        time: originalEvent.time,
        duration: originalEvent.duration,
        location: originalEvent.location,
        color: originalEvent.color,
        isAllDay: originalEvent.isAllDay,
        priority: originalEvent.priority,
        category: originalEvent.category,
        tags: originalEvent.tags,
        attendees: originalEvent.attendees,
        reminder: originalEvent.reminder,
        recurring: originalEvent.recurring,
        attachments: originalEvent.attachments,
      },
      eventWithCalendar.calendarId
    );
  }
}
