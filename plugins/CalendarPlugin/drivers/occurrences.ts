import type { CalendarDoc, CalendarEvent, CalendarRRule, DateRange, Occurrence } from '../types';
import { addDays, civilDate, startOfWeek } from './defaults';

const OCCURRENCE_CAP = 400;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseCivil(iso: string): Date {
  const date = civilDate(iso);
  const parts = date.split('-');
  const y = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 1;
  const d = Number(parts[2]) || 1;
  return new Date(y, m - 1, d);
}

function formatCivil(dt: Date): string {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function timeOf(iso: string): string {
  return iso.includes('T') ? iso.slice(11, 16) : '00:00';
}

function durationMs(event: CalendarEvent): number {
  if (event.allDay) {
    const start = parseCivil(event.start).getTime();
    const end = parseCivil(event.end).getTime();
    return Math.max(0, end - start);
  }
  const startParts = civilDate(event.start).split('-');
  const endParts = civilDate(event.end).split('-');
  const startTime = timeOf(event.start).split(':');
  const endTime = timeOf(event.end).split(':');
  const a = new Date(
    Number(startParts[0]) || 0,
    (Number(startParts[1]) || 1) - 1,
    Number(startParts[2]) || 1,
    Number(startTime[0]) || 0,
    Number(startTime[1]) || 0
  ).getTime();
  const b = new Date(
    Number(endParts[0]) || 0,
    (Number(endParts[1]) || 1) - 1,
    Number(endParts[2]) || 1,
    Number(endTime[0]) || 0,
    Number(endTime[1]) || 0
  ).getTime();
  return Math.max(15 * 60_000, b - a);
}

function occurrenceFrom(event: CalendarEvent, startCivil: string): Occurrence {
  if (event.allDay) {
    const spanDays = Math.max(
      0,
      Math.round((parseCivil(event.end).getTime() - parseCivil(event.start).getTime()) / 86_400_000)
    );
    const end = addDays(startCivil, spanDays);
    return {
      eventId: event.id,
      calendarId: event.calendarId,
      title: event.title,
      start: startCivil,
      end,
      allDay: true,
      color: event.color,
      isMaster: startCivil === civilDate(event.start),
    };
  }
  const t0 = timeOf(event.start);
  const start = `${startCivil}T${t0}`;
  const ms = durationMs(event);
  const parts = startCivil.split('-');
  const timeParts = t0.split(':');
  const endDt = new Date(
    Number(parts[0]) || 0,
    (Number(parts[1]) || 1) - 1,
    Number(parts[2]) || 1,
    Number(timeParts[0]) || 0,
    Number(timeParts[1]) || 0,
    0,
    ms
  );
  const end = `${endDt.getFullYear()}-${pad2(endDt.getMonth() + 1)}-${pad2(endDt.getDate())}T${pad2(endDt.getHours())}:${pad2(endDt.getMinutes())}`;
  return {
    eventId: event.id,
    calendarId: event.calendarId,
    title: event.title,
    start,
    end,
    allDay: false,
    color: event.color,
    isMaster: startCivil === civilDate(event.start),
  };
}

function weekdayMon0(dt: Date): number {
  return (dt.getDay() + 6) % 7;
}

function advance(dt: Date, freq: CalendarRRule['freq'], interval: number): void {
  if (freq === 'daily') {
    dt.setDate(dt.getDate() + interval);
  } else if (freq === 'weekly') {
    dt.setDate(dt.getDate() + 7 * interval);
  } else if (freq === 'monthly') {
    dt.setMonth(dt.getMonth() + interval);
  } else {
    dt.setFullYear(dt.getFullYear() + interval);
  }
}

/** Expand visible events into occurrences in `[range.start, range.end)`. */
export function occurrences(doc: CalendarDoc, range: DateRange): Occurrence[] {
  const visible = new Set(doc.calendars.filter((c) => c.visible).map((c) => c.id));
  const out: Occurrence[] = [];
  const rangeStart = parseCivil(range.start).getTime();
  const rangeEnd = parseCivil(range.end).getTime();

  for (const event of doc.events) {
    if (!visible.has(event.calendarId)) {
      continue;
    }
    if (!event.rrule) {
      const start = civilDate(event.start);
      // End is exclusive civil day so same-day timed events still intersect the range.
      const endExclusive = addDays(civilDate(event.end), 1);
      const s = parseCivil(start).getTime();
      const e = parseCivil(endExclusive).getTime();
      if (e > rangeStart && s < rangeEnd) {
        out.push(occurrenceFrom(event, start));
        if (out.length >= OCCURRENCE_CAP) {
          return out;
        }
      }
      continue;
    }

    const rule = event.rrule;
    const seed = parseCivil(event.start);
    const until = rule.until !== undefined ? parseCivil(rule.until).getTime() : rangeEnd;
    const maxCount = rule.count ?? OCCURRENCE_CAP;
    let count = 0;
    const cursor = new Date(seed.getTime());
    let guard = 0;
    while (count < maxCount && guard < OCCURRENCE_CAP * 4) {
      guard += 1;
      const civil = formatCivil(cursor);
      const t = cursor.getTime();
      if (t > until || t >= rangeEnd) {
        break;
      }
      const byweekday = rule.byweekday;
      const weekdayOk =
        byweekday === undefined ||
        byweekday.length === 0 ||
        byweekday.includes(weekdayMon0(cursor));
      if (weekdayOk && t >= rangeStart) {
        out.push(occurrenceFrom(event, civil));
        count += 1;
        if (out.length >= OCCURRENCE_CAP) {
          return out;
        }
      } else if (weekdayOk && t < rangeStart) {
        count += 1;
      }
      advance(cursor, rule.freq, rule.interval);
    }
  }

  return out.toSorted((a, b) => a.start.localeCompare(b.start));
}

export function monthRange(cursor: string): DateRange {
  const parts = cursor.split('-');
  const y = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 1;
  const start = `${y}-${pad2(m)}-01`;
  const dt = parseCivil(start);
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day);
  const gridStart = formatCivil(dt);
  return { start: gridStart, end: addDays(gridStart, 42) };
}

export function weekRange(cursor: string): DateRange {
  const start = startOfWeek(cursor, 1);
  return { start, end: addDays(start, 7) };
}

export function dayRange(cursor: string): DateRange {
  return { start: cursor, end: addDays(cursor, 1) };
}

export function yearRange(cursor: string): DateRange {
  const y = cursor.slice(0, 4);
  return { start: `${y}-01-01`, end: `${Number(y) + 1}-01-01` };
}

export function agendaRange(cursor: string, days = 30): DateRange {
  return { start: cursor, end: addDays(cursor, days) };
}

export function rangeForView(doc: CalendarDoc): DateRange {
  if (doc.view === 'week') {
    return weekRange(doc.cursor);
  }
  if (doc.view === 'day') {
    return dayRange(doc.cursor);
  }
  if (doc.view === 'year') {
    return yearRange(doc.cursor);
  }
  if (doc.view === 'agenda') {
    return agendaRange(doc.cursor);
  }
  return monthRange(doc.cursor);
}
