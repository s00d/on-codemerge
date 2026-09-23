import type { Calendar, CalendarEvent, Category, CreateEventData, Reminder, Tag } from '../types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isCategory(value: unknown): value is Category {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    typeof value.createdAt === 'number'
  );
}

export function isTag(value: unknown): value is Tag {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    typeof value.createdAt === 'number'
  );
}

export function isReminder(value: unknown): value is Reminder {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.eventId === 'string' &&
    typeof value.calendarId === 'string' &&
    typeof value.triggerTime === 'number' &&
    typeof value.message === 'string' &&
    typeof value.isShown === 'boolean' &&
    typeof value.createdAt === 'number'
  );
}

export function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.date !== 'string' ||
    typeof value.time !== 'string' ||
    typeof value.createdAt !== 'number' ||
    typeof value.updatedAt !== 'number'
  ) {
    return false;
  }
  if (value.tags !== undefined && !isStringArray(value.tags)) {
    return false;
  }
  return true;
}

export function isCalendar(value: unknown): value is Calendar {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.createdAt !== 'number' ||
    typeof value.updatedAt !== 'number'
  ) {
    return false;
  }
  if (!Array.isArray(value.events)) {
    return false;
  }
  return value.events.every(isCalendarEvent);
}

export function isCreateEventData(value: unknown): value is CreateEventData {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.title !== 'string' ||
    typeof value.date !== 'string' ||
    typeof value.time !== 'string'
  ) {
    return false;
  }
  if (value.tags !== undefined && !isStringArray(value.tags)) {
    return false;
  }
  return true;
}

export function parseCategoryArray(value: unknown): Category[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isCategory);
}

export function parseTagArray(value: unknown): Tag[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isTag);
}

export function parseReminderArray(value: unknown): Reminder[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isReminder);
}

export function parseCalendarArray(value: unknown): Calendar[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isCalendar);
}

export function parseEventStorageArray(value: unknown): (CalendarEvent & { calendarId: string })[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is CalendarEvent & { calendarId: string } => {
    if (!isRecord(item) || typeof item.calendarId !== 'string') {
      return false;
    }
    return isCalendarEvent(item);
  });
}

export function parseCreateEventArray(value: unknown): CreateEventData[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isCreateEventData);
}

export function parseEventPriority(value: string): 'low' | 'medium' | 'high' | undefined {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  return undefined;
}

export function parseImportCalendarMeta(value: unknown): { title?: string; description?: string } {
  if (!isRecord(value)) {
    return {};
  }
  return {
    title: typeof value.title === 'string' ? value.title : undefined,
    description: typeof value.description === 'string' ? value.description : undefined,
  };
}

export function parseCalendarImportPayload(
  raw: unknown
): { calendar: Calendar; events: CalendarEvent[] } | null {
  if (!isRecord(raw)) {
    return null;
  }
  const calendar = raw.calendar;
  if (!isCalendar(calendar)) {
    return null;
  }
  const eventsRaw = raw.events;
  const events = Array.isArray(eventsRaw) ? eventsRaw.filter(isCalendarEvent) : [];
  return { calendar, events };
}
