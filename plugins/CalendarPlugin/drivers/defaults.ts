import type {
  CalendarDoc,
  CalendarEvent,
  CalendarLayer,
  CalendarRRule,
  CalendarView,
} from '../types';
import { isCalendarDoc, isCalendarView, isRecord } from '../types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseYmd(cursor: string): { y: number; m: number; d: number } {
  const parts = cursor.split('-');
  return {
    y: Number(parts[0]) || 0,
    m: Number(parts[1]) || 1,
    d: Number(parts[2]) || 1,
  };
}

/** Civil today as `YYYY-MM-DD` in the given IANA tz (via Intl). */
export function todayCursor(tz?: string, now = new Date()): string {
  const zone = tz && tz.length > 0 ? tz : defaultTz();
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }
}

export function defaultTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Short zone label for UI (Intl). */
export function tzLabel(tz: string, now = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(now);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz;
  } catch {
    return tz;
  }
}

/**
 * Format stored wall-clock event when for display.
 * Times are civil in `doc.tz`; Intl supplies the zone label.
 */
export function formatEventWhen(iso: string, allDay: boolean, tz: string): string {
  if (allDay || !iso.includes('T')) {
    return civilDate(iso);
  }
  const time = iso.slice(11, 16);
  const label = tzLabel(tz);
  return label === tz ? `${civilDate(iso)} ${time}` : `${civilDate(iso)} ${time} ${label}`;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyLayer(partial?: Partial<CalendarLayer>): CalendarLayer {
  return {
    id: partial?.id ?? newId('cal'),
    title: partial?.title ?? 'Calendar',
    color: partial?.color ?? '#3b82f6',
    visible: partial?.visible ?? true,
  };
}

export function emptyEvent(calendarId: string, partial?: Partial<CalendarEvent>): CalendarEvent {
  const cursor = todayCursor();
  const start = partial?.start ?? `${cursor}T09:00`;
  const end = partial?.end ?? `${cursor}T10:00`;
  return {
    id: partial?.id ?? newId('evt'),
    calendarId,
    title: partial?.title ?? 'New event',
    start,
    end,
    allDay: partial?.allDay ?? false,
    location: partial?.location,
    description: partial?.description,
    color: partial?.color,
    reminder: partial?.reminder,
    rrule: partial?.rrule,
  };
}

export function emptyCalendarDoc(partial?: Partial<CalendarDoc>): CalendarDoc {
  const layer = emptyLayer(partial?.calendars?.[0]);
  const calendars =
    partial?.calendars !== undefined && partial.calendars.length > 0 ? partial.calendars : [layer];
  const tz = partial?.tz ?? defaultTz();
  return {
    title: partial?.title ?? 'Calendar',
    tz,
    view: partial?.view ?? 'month',
    cursor: partial?.cursor ?? todayCursor(tz),
    calendars,
    events: partial?.events ?? [],
  };
}

/** Civil date part from start/end string. */
export function civilDate(iso: string): string {
  return iso.slice(0, 10);
}

export function addDays(cursor: string, days: number): string {
  const { y, m, d } = parseYmd(cursor);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

export function startOfWeek(cursor: string, weekStartsOn = 1): string {
  const { y, m, d } = parseYmd(cursor);
  const dt = new Date(y, m - 1, d);
  const day = (dt.getDay() + 7 - weekStartsOn) % 7;
  dt.setDate(dt.getDate() - day);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function patchEvent(
  doc: CalendarDoc,
  id: string,
  patch: Partial<CalendarEvent>
): CalendarDoc {
  return {
    ...doc,
    events: doc.events.map((e) => (e.id === id ? { ...e, ...patch, id: e.id } : e)),
  };
}

export function addEvent(doc: CalendarDoc, event: CalendarEvent): CalendarDoc {
  return { ...doc, events: [...doc.events, event] };
}

export function removeEvent(doc: CalendarDoc, id: string): CalendarDoc {
  return { ...doc, events: doc.events.filter((e) => e.id !== id) };
}

export function patchLayer(
  doc: CalendarDoc,
  id: string,
  patch: Partial<CalendarLayer>
): CalendarDoc {
  return {
    ...doc,
    calendars: doc.calendars.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)),
  };
}

export function addLayer(doc: CalendarDoc, layer?: Partial<CalendarLayer>): CalendarDoc {
  return { ...doc, calendars: [...doc.calendars, emptyLayer(layer)] };
}

export function removeLayer(doc: CalendarDoc, id: string): CalendarDoc {
  if (doc.calendars.length <= 1) {
    return doc;
  }
  return {
    ...doc,
    calendars: doc.calendars.filter((c) => c.id !== id),
    events: doc.events.filter((e) => e.calendarId !== id),
  };
}

/** Coerce unknown JSON (new CalendarDoc or legacy payload) into CalendarDoc. */
export function coerceCalendarDoc(raw: unknown): CalendarDoc {
  if (isCalendarDoc(raw)) {
    return {
      ...raw,
      calendars: raw.calendars.length > 0 ? raw.calendars : [emptyLayer()],
      events: raw.events,
    };
  }
  if (!isRecord(raw)) {
    return emptyCalendarDoc();
  }

  // Legacy: { calendar, events }
  if (isRecord(raw.calendar) || Array.isArray(raw.events)) {
    const cal = isRecord(raw.calendar) ? raw.calendar : {};
    const layer = emptyLayer({
      id: typeof cal.id === 'string' ? cal.id : undefined,
      title: typeof cal.title === 'string' ? cal.title : 'Calendar',
    });
    const legacyEvents = Array.isArray(raw.events) ? raw.events : [];
    const events: CalendarEvent[] = [];
    for (const item of legacyEvents) {
      const e = coerceLegacyEvent(item, layer.id);
      if (e) {
        events.push(e);
      }
    }
    if (Array.isArray(cal.events)) {
      for (const item of cal.events) {
        const e = coerceLegacyEvent(item, layer.id);
        if (e && !events.some((x) => x.id === e.id)) {
          events.push(e);
        }
      }
    }
    return emptyCalendarDoc({
      title: layer.title,
      calendars: [layer],
      events,
    });
  }

  let view: CalendarView | undefined;
  if (isCalendarView(raw.view)) {
    view = raw.view;
  }
  return emptyCalendarDoc({
    title: typeof raw.title === 'string' ? raw.title : undefined,
    tz: typeof raw.tz === 'string' ? raw.tz : undefined,
    view,
  });
}

function coerceLegacyEvent(raw: unknown, calendarId: string): CalendarEvent | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = typeof raw.id === 'string' ? raw.id : newId('evt');
  const title = typeof raw.title === 'string' ? raw.title : 'Event';
  if (typeof raw.start === 'string' && typeof raw.end === 'string') {
    return {
      id,
      calendarId: typeof raw.calendarId === 'string' ? raw.calendarId : calendarId,
      title,
      start: raw.start,
      end: raw.end,
      allDay: Boolean(raw.allDay ?? raw.isAllDay),
      location: typeof raw.location === 'string' ? raw.location : undefined,
      description: typeof raw.description === 'string' ? raw.description : undefined,
      color: typeof raw.color === 'string' ? raw.color : undefined,
      reminder: typeof raw.reminder === 'number' ? raw.reminder : undefined,
      rrule: coerceRrule(raw.rrule ?? raw.recurring),
    };
  }
  const date = typeof raw.date === 'string' ? raw.date : todayCursor();
  const time = typeof raw.time === 'string' && raw.time.length > 0 ? raw.time : '09:00';
  const duration = typeof raw.duration === 'number' ? raw.duration : 60;
  const allDay = Boolean(raw.isAllDay ?? raw.allDay);
  const start = allDay ? date : `${date}T${time.slice(0, 5)}`;
  const end = allDay ? date : addMinutesIso(start, duration);
  return {
    id,
    calendarId: typeof raw.calendarId === 'string' ? raw.calendarId : calendarId,
    title,
    start,
    end,
    allDay,
    location: typeof raw.location === 'string' ? raw.location : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    color: typeof raw.color === 'string' ? raw.color : undefined,
    reminder: typeof raw.reminder === 'number' ? raw.reminder : undefined,
    rrule: coerceRrule(raw.rrule ?? raw.recurring),
  };
}

function coerceRrule(raw: unknown): CalendarRRule | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const freqRaw = raw.freq ?? raw.type;
  if (
    freqRaw !== 'daily' &&
    freqRaw !== 'weekly' &&
    freqRaw !== 'monthly' &&
    freqRaw !== 'yearly'
  ) {
    return undefined;
  }
  const interval = typeof raw.interval === 'number' && raw.interval > 0 ? raw.interval : 1;
  const rule: CalendarRRule = { freq: freqRaw, interval };
  if (typeof raw.until === 'string') {
    rule.until = raw.until;
  } else if (typeof raw.endDate === 'string') {
    rule.until = raw.endDate;
  }
  if (typeof raw.count === 'number') {
    rule.count = raw.count;
  }
  if (Array.isArray(raw.byweekday)) {
    rule.byweekday = raw.byweekday.filter((n): n is number => typeof n === 'number');
  }
  return rule;
}

function addMinutesIso(start: string, minutes: number): string {
  const datePart = start.slice(0, 10);
  const timePart = start.includes('T') ? start.slice(11, 16) : '09:00';
  const { y, m, d } = parseYmd(datePart);
  const timeParts = timePart.split(':');
  const hh = Number(timeParts[0]) || 0;
  const mm = Number(timeParts[1]) || 0;
  const dt = new Date(y, m - 1, d, hh, mm + minutes);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}
