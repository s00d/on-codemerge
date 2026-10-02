/** Calendar view mode in studio / widget. */
export type CalendarView = 'month' | 'week' | 'day' | 'year' | 'agenda';

export type CalendarLayer = {
  id: string;
  title: string;
  color: string;
  visible: boolean;
};

export type CalendarRRule = {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: string;
  count?: number;
  /** 0 = Monday … 6 = Sunday */
  byweekday?: number[];
};

export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  /** ISO local datetime `YYYY-MM-DDTHH:mm` or date `YYYY-MM-DD` for allDay */
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  color?: string;
  /** Minutes before start */
  reminder?: number;
  rrule?: CalendarRRule;
};

export type CalendarDoc = {
  title: string;
  /** IANA timezone for display (single doc-level tz). */
  tz: string;
  view: CalendarView;
  /** Focused civil day `YYYY-MM-DD`. */
  cursor: string;
  calendars: CalendarLayer[];
  events: CalendarEvent[];
};

export type DateRange = { start: string; end: string };

export type Occurrence = {
  eventId: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  color?: string;
  isMaster: boolean;
};

export type CalendarI18n = { t: (key: string) => string };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isCalendarView(value: unknown): value is CalendarView {
  return (
    value === 'month' ||
    value === 'week' ||
    value === 'day' ||
    value === 'year' ||
    value === 'agenda'
  );
}

export function isCalendarLayer(value: unknown): value is CalendarLayer {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.color === 'string' &&
    typeof value.visible === 'boolean'
  );
}

export function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.calendarId === 'string' &&
    typeof value.title === 'string' &&
    typeof value.start === 'string' &&
    typeof value.end === 'string' &&
    typeof value.allDay === 'boolean'
  );
}

export function isCalendarDoc(value: unknown): value is CalendarDoc {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.title !== 'string' || typeof value.tz !== 'string') {
    return false;
  }
  if (!isCalendarView(value.view) || typeof value.cursor !== 'string') {
    return false;
  }
  if (!Array.isArray(value.calendars) || !value.calendars.every(isCalendarLayer)) {
    return false;
  }
  if (!Array.isArray(value.events) || !value.events.every(isCalendarEvent)) {
    return false;
  }
  return true;
}
