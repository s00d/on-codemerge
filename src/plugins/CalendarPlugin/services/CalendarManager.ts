import type {
  Calendar,
  CalendarEvent,
  Category,
  CreateCalendarData,
  CreateEventData,
  Tag,
  UpdateCalendarData,
  UpdateEventData,
} from '../types';
import type { ViewSpec } from '@on-codemerge/sdk';
import { h } from '@on-codemerge/sdk';
import { CategoryManager } from './CategoryManager';
import { ReminderService } from './ReminderService';
import { parseJson } from '../../../utils/asAttr';
import { atomAlignStyle } from '../../../utils/atomAlign';

function asCalendarArray(value: unknown): Calendar[] {
  return Array.isArray(value) ? (value as Calendar[]) : [];
}

function asEventArray(value: unknown): (CalendarEvent & { calendarId: string })[] {
  return Array.isArray(value) ? (value as (CalendarEvent & { calendarId: string })[]) : [];
}

function asCategoryArray(value: unknown): Category[] {
  return Array.isArray(value) ? (value as Category[]) : [];
}

function asTagArray(value: unknown): Tag[] {
  return Array.isArray(value) ? (value as Tag[]) : [];
}

function asCreateEventArray(value: unknown): CreateEventData[] {
  return Array.isArray(value) ? (value as CreateEventData[]) : [];
}

export class CalendarManager {
  private readonly calendarsKey = 'html-editor-calendars';
  private readonly eventsKey = 'html-editor-calendar-events';
  private readonly categoryManager: CategoryManager;
  private readonly reminderService: ReminderService;

  constructor() {
    this.categoryManager = new CategoryManager();
    this.reminderService = new ReminderService(this);
  }

  public getCalendars(): Calendar[] {
    const stored = localStorage.getItem(this.calendarsKey);
    return stored !== null && stored !== undefined && stored !== ''
      ? asCalendarArray(parseJson(stored))
      : [];
  }

  public getCalendar(id: string): Calendar | null {
    const calendars = this.getCalendars();
    return calendars.find((cal) => cal.id === id) ?? null;
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
    return allEvents.find((event) => event.id === id) ?? null;
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
      priority: data.priority ?? 'medium',
      category: data.category,
      tags: data.tags ?? [],
      attendees: data.attendees ?? [],
      reminder: data.reminder,
      recurring: data.recurring,
      attachments: data.attachments ?? [],
      calendarId: calendarId ?? 'default',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    allEvents.push(newEvent);
    localStorage.setItem(this.eventsKey, JSON.stringify(allEvents));

    // Создаем напоминание, если указано
    if (
      newEvent.reminder !== null &&
      newEvent.reminder !== undefined &&
      calendarId !== null &&
      calendarId !== undefined &&
      calendarId !== ''
    ) {
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
        (event.title.toLowerCase().includes(lowerQuery) ||
          event.description?.toLowerCase().includes(lowerQuery)) ??
        event.location?.toLowerCase().includes(lowerQuery) ??
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

  /** Calendar ViewSpec for editor + publish (optional reminders runtime attrs). */
  public calendarView(
    calendar: Calendar,
    opts?: { publish?: boolean; emptyLabel?: string; align?: string }
  ): ViewSpec {
    const events = this.getEvents(calendar.id).toSorted((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    const attrs: Record<string, string> = {
      'data-calendar-id': calendar.id,
    };
    if (opts?.publish) {
      attrs['data-node'] = 'calendar';
      const reminders = this.collectPublishReminders(calendar.id);
      if (reminders.length > 0) {
        attrs['data-ocm-runtime'] = 'calendar-reminders';
        attrs['data-ocm-config'] = JSON.stringify({ reminders });
      }
    }

    const alignStyle = atomAlignStyle(opts?.align ?? '');
    const style =
      Object.keys(alignStyle).length > 0 ? { maxWidth: '28rem', ...alignStyle } : undefined;

    return h(
      'div',
      {
        class: 'calendar-widget not-prose',
        attrs,
        style,
      },
      [
        h('div', { class: 'calendar-header' }, [
          h('h3', { class: 'calendar-title' }, calendar.title),
        ]),
        h('div', { class: 'calendar-body' }, [
          events.length === 0
            ? h('div', { class: 'calendar-empty' }, opts?.emptyLabel ?? 'No events')
            : h(
                'div',
                { class: 'calendar-events' },
                events.map((event) => this.eventView(event))
              ),
        ]),
      ]
    );
  }

  private collectPublishReminders(calendarId: string): {
    id: string;
    triggerTime: number;
    message: string;
  }[] {
    const fromStore = this.reminderService.getPublishReminders(calendarId);
    const fromEvents = this.getEvents(calendarId)
      .filter((e) => e.reminder !== null && e.reminder !== undefined)
      .map((e) => {
        const eventDate = new Date(`${e.date}T${e.time}`);
        const minutes = Number(e.reminder);
        return {
          id: `evt-${e.id}`,
          triggerTime: eventDate.getTime() - minutes * 60 * 1000,
          message: `Reminder: ${e.title} starts in ${minutes} minutes`,
        };
      });
    const seen = new Set<string>();
    return [...fromStore, ...fromEvents].filter((r) => {
      if (seen.has(r.id)) {
        return false;
      }
      seen.add(r.id);
      return true;
    });
  }

  private eventView(event: CalendarEvent): ViewSpec {
    const priorityClass = event.priority ?? 'medium';
    const categoryName = (event.category ?? '').trim();
    const showCategory = categoryName.length > 0;
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const sub: ViewSpec[] = [
      h('span', { class: 'event-date' }, formattedDate),
      h('span', { class: 'event-time' }, event.time),
    ];
    if (event.location) {
      sub.push(h('span', { class: 'event-location' }, event.location));
    }
    if (event.duration !== null && event.duration !== undefined) {
      sub.push(h('span', { class: 'event-duration' }, `${event.duration} min`));
    }
    if (event.attendees && event.attendees.length > 0) {
      sub.push(h('span', { class: 'event-attendees' }, event.attendees.join(', ')));
    }
    if (event.reminder !== null && event.reminder !== undefined) {
      sub.push(h('span', { class: 'event-reminder' }, `${event.reminder} min`));
    }
    if (event.description) {
      sub.push(h('span', { class: 'event-description' }, event.description));
    }

    return h(
      'div',
      {
        class: 'calendar-event',
        attrs: { 'data-event-id': event.id },
        style: event.color ? { ['--event-color' as string]: event.color } : undefined,
      },
      [
        h('div', { class: 'event-title-row' }, [
          h('div', { class: 'event-title' }, event.title),
          h('div', { class: `event-priority priority-${priorityClass}` }, priorityClass),
          showCategory ? h('div', { class: 'event-category' }, categoryName) : null,
        ]),
        h('div', { class: 'event-sub' }, sub),
        event.tags && event.tags.length > 0
          ? h(
              'div',
              { class: 'event-tags' },
              event.tags.map((tag) => h('span', { class: 'event-tag' }, tag))
            )
          : null,
      ]
    );
  }

  private getAllEvents(): (CalendarEvent & { calendarId: string })[] {
    const stored = localStorage.getItem(this.eventsKey);
    return stored !== null && stored !== undefined && stored !== ''
      ? asEventArray(parseJson(stored))
      : [];
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
      const importData = parseJson(data);
      if (
        importData === null ||
        importData === undefined ||
        typeof importData !== 'object' ||
        Array.isArray(importData)
      ) {
        throw new Error('Invalid calendar data format');
      }
      const payload = importData as {
        calendar?: { title?: string; description?: string };
        events?: unknown;
        categories?: unknown;
        tags?: unknown;
      };
      const calendar = payload.calendar;
      const events = asCreateEventArray(payload.events ?? []);
      const categories = asCategoryArray(payload.categories ?? []);
      const tags = asTagArray(payload.tags ?? []);

      // Импортируем категории и теги
      categories.forEach((cat) => {
        this.categoryManager.createCategory(cat.name, cat.color);
      });

      tags.forEach((tag) => {
        this.categoryManager.createTag(tag.name, tag.color);
      });

      const newCalendar = this.createCalendar({
        title: calendar?.title ?? 'Imported',
        description: calendar?.description,
      });

      events.forEach((eventData) => {
        this.createEvent(eventData, newCalendar.id);
      });

      return newCalendar;
    } catch (error) {
      throw new Error('Invalid calendar data format', { cause: error });
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
