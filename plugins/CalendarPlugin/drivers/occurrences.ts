import type { CalendarDoc, CalendarEvent, CalendarRRule, DateRange, Occurrence } from '../types';
import { addDays, civilDate, civilToEpoch, startOfWeek, todayCursor } from './defaults';

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

/**
 * Candidate days of the k-th recurrence period, computed from the seed (no drift:
 * monthly on the 31st / yearly on Feb 29 skip periods without that day, RFC 5545).
 * Weekly + byweekday expands to every listed weekday of the period's week.
 */
function periodDays(
  seed: Date,
  freq: CalendarRRule['freq'],
  interval: number,
  k: number,
  weekdays: number[] | null
): Date[] {
  const y = seed.getFullYear();
  const m = seed.getMonth();
  const d = seed.getDate();
  if (freq === 'daily') {
    return [new Date(y, m, d + k * interval)];
  }
  if (freq === 'weekly') {
    if (!weekdays) {
      return [new Date(y, m, d + 7 * k * interval)];
    }
    const monday = d - weekdayMon0(seed) + 7 * k * interval;
    return weekdays.map((wd) => new Date(y, m, monday + wd)).filter((dt) => dt >= seed);
  }
  const dt =
    freq === 'monthly' ? new Date(y, m + k * interval, d) : new Date(y + k * interval, m, d);
  return dt.getDate() === d ? [dt] : [];
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
    const interval = Math.max(1, Math.floor(rule.interval) || 1);
    const until = rule.until !== undefined ? parseCivil(rule.until).getTime() : Infinity;
    const maxCount = rule.count ?? Infinity;
    const weekdays =
      rule.byweekday !== undefined && rule.byweekday.length > 0
        ? [...new Set(rule.byweekday)].toSorted((a, b) => a - b)
        : null;
    const expandWeek = rule.freq === 'weekly' && weekdays !== null;
    // An occurrence starting up to `spanDays` before the range still runs into it (overlap, not start).
    const spanDays = Math.max(
      0,
      Math.round((parseCivil(civilDate(event.end)).getTime() - seed.getTime()) / 86_400_000)
    );
    const overlapStart = parseCivil(addDays(range.start, -spanDays)).getTime();
    let count = 0;
    let done = false;
    // ponytail: walks from the seed (COUNT needs it); ~3.6k steps per decade of daily events.
    for (let k = 0; !done && count < maxCount && k < 100_000; k++) {
      for (const cursor of periodDays(seed, rule.freq, interval, k, expandWeek ? weekdays : null)) {
        const t = cursor.getTime();
        if (t > until || t >= rangeEnd) {
          done = true;
          break;
        }
        if (!expandWeek && weekdays !== null && !weekdays.includes(weekdayMon0(cursor))) {
          continue;
        }
        count += 1;
        if (t >= overlapStart) {
          out.push(occurrenceFrom(event, formatCivil(cursor)));
          if (out.length >= OCCURRENCE_CAP) {
            return out;
          }
        }
        if (count >= maxCount) {
          break;
        }
      }
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

/** Recurring reminders are expanded this far ahead of publish time. */
export const REMINDER_HORIZON_DAYS = 60;

export type RemindersConfig = {
  reminders: Array<{ id: string; triggerTime: number; message: string; title: string }>;
};

/**
 * Published reminder schedule. One-off events keep their single reminder; recurring events get one
 * per occurrence in `[today − 1, today + REMINDER_HORIZON_DAYS)` (ids `eventId@start`).
 */
export function remindersConfig(doc: CalendarDoc, now = new Date()): RemindersConfig | null {
  const today = todayCursor(doc.tz, now);
  const horizon: DateRange = {
    start: addDays(today, -1),
    end: addDays(today, REMINDER_HORIZON_DAYS),
  };
  const reminders: RemindersConfig['reminders'] = [];
  const push = (id: string, event: CalendarEvent, start: string) => {
    // Stored times are wall-clock in doc.tz, not the viewer's zone.
    const at = civilToEpoch(event.allDay ? `${start.slice(0, 10)}T09:00` : start, doc.tz);
    const triggerTime = at - (event.reminder ?? 0) * 60_000;
    if (Number.isFinite(triggerTime)) {
      reminders.push({ id, triggerTime, message: event.title, title: doc.title });
    }
  };
  for (const event of doc.events) {
    if (typeof event.reminder !== 'number' || event.reminder <= 0) {
      continue;
    }
    if (!event.rrule) {
      push(event.id, event, event.start);
      continue;
    }
    // Reminders ignore layer visibility (a hidden layer still rings).
    const single: CalendarDoc = {
      ...doc,
      calendars: [{ id: event.calendarId, title: '', color: '', visible: true }],
      events: [event],
    };
    for (const occ of occurrences(single, horizon)) {
      push(`${event.id}@${occ.start}`, event, occ.start);
    }
  }
  return reminders.length > 0 ? { reminders } : null;
}
