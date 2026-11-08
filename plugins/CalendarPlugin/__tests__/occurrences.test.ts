import { describe, expect, it } from 'vitest';
import { emptyCalendarDoc, moveTimedEvent } from '../drivers/defaults';
import { occurrences, remindersConfig, weekRange, monthRange } from '../drivers/occurrences';

describe('occurrences', () => {
  it('expands daily rrule inside week range', () => {
    const doc = emptyCalendarDoc({
      calendars: [{ id: 'c', title: 'C', color: '#000', visible: true }],
      events: [
        {
          id: 'e1',
          calendarId: 'c',
          title: 'Daily',
          start: '2026-10-01T09:00',
          end: '2026-10-01T09:30',
          allDay: false,
          rrule: { freq: 'daily', interval: 1, count: 5 },
        },
      ],
      cursor: '2026-10-01',
    });
    const occs = occurrences(doc, weekRange('2026-10-01'));
    // week of 2026-10-01 is Mon Sep 28 → Sun Oct 4 → daily from Oct 1 yields 4 days in-range
    expect(occs.length).toBe(4);
    expect(occs.every((o) => o.title === 'Daily')).toBe(true);
  });

  it('expands weekly rrule', () => {
    const doc = emptyCalendarDoc({
      calendars: [{ id: 'c', title: 'C', color: '#000', visible: true }],
      events: [
        {
          id: 'e1',
          calendarId: 'c',
          title: 'Weekly',
          start: '2026-10-01T10:00',
          end: '2026-10-01T11:00',
          allDay: false,
          rrule: { freq: 'weekly', interval: 1, count: 3 },
        },
      ],
      cursor: '2026-10-01',
    });
    const occs = occurrences(doc, monthRange('2026-10-15'));
    expect(occs).toHaveLength(3);
    expect(occs.map((o) => o.start.slice(0, 10))).toStrictEqual([
      '2026-10-01',
      '2026-10-08',
      '2026-10-15',
    ]);
  });

  it('recurring events get a reminder per upcoming occurrence; one-offs keep one', () => {
    const doc = emptyCalendarDoc({
      tz: 'UTC',
      calendars: [{ id: 'c', title: 'C', color: '#000', visible: false }],
      events: [
        {
          id: 'w',
          calendarId: 'c',
          title: 'Weekly',
          start: '2026-01-05T10:00',
          end: '2026-01-05T11:00',
          allDay: false,
          reminder: 15,
          rrule: { freq: 'weekly', interval: 1 },
        },
        {
          id: 'once',
          calendarId: 'c',
          title: 'Once',
          start: '2027-06-01T10:00',
          end: '2027-06-01T11:00',
          allDay: false,
          reminder: 5,
        },
      ],
    });
    const cfg = remindersConfig(doc, new Date('2026-10-07T12:00:00Z'));
    const ids = cfg?.reminders.map((r) => r.id) ?? [];
    expect(ids).toContain('once');
    const weekly = ids.filter((id) => id.startsWith('w@'));
    // Mondays from 2026-10-12 within the 60-day horizon (Oct 12 … Dec 5).
    expect(weekly[0]).toBe('w@2026-10-12T10:00');
    expect(weekly.length).toBe(8);
    const first = cfg?.reminders.find((r) => r.id === 'w@2026-10-12T10:00');
    expect(first?.triggerTime).toBe(Date.UTC(2026, 9, 12, 9, 45));
  });

  it('moveTimedEvent keeps duration across midnight', () => {
    expect(
      moveTimedEvent({ start: '2026-10-01T22:00', end: '2026-10-02T01:30' }, '2026-10-05', 23 * 60)
    ).toStrictEqual({ start: '2026-10-05T23:00', end: '2026-10-06T02:30' });
  });

  it('recurring occurrences that start before the range but run into it are included', () => {
    const doc = emptyCalendarDoc({
      calendars: [{ id: 'c', title: 'C', color: '#000', visible: true }],
      events: [
        {
          // Sundays 23:00 → Mondays 01:00
          id: 'night',
          calendarId: 'c',
          title: 'Night',
          start: '2026-09-27T23:00',
          end: '2026-09-28T01:00',
          allDay: false,
          rrule: { freq: 'weekly', interval: 1 },
        },
        {
          // Sat–Mon all-day, weekly
          id: 'trip',
          calendarId: 'c',
          title: 'Trip',
          start: '2026-09-26',
          end: '2026-09-28',
          allDay: true,
          rrule: { freq: 'weekly', interval: 1 },
        },
      ],
    });
    // Week Mon Oct 5 → Sun Oct 11: Oct 4 (Sun) night and Oct 3 (Sat) trip both reach Monday.
    const occs = occurrences(doc, weekRange('2026-10-05'));
    expect(occs.filter((o) => o.eventId === 'night').map((o) => o.start)).toStrictEqual([
      '2026-10-04T23:00',
      '2026-10-11T23:00',
    ]);
    expect(occs.filter((o) => o.eventId === 'trip').map((o) => o.start)).toStrictEqual([
      '2026-10-03',
      '2026-10-10',
    ]);
  });
});
