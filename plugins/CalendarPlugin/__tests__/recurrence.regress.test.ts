import { describe, expect, it } from 'vitest';
import { addMonths, civilToEpoch, emptyCalendarDoc } from '../drivers/defaults';
import { occurrences } from '../drivers/occurrences';
import { parseIcs, serializeIcs } from '../io/ics';
import type { CalendarEvent } from '../types';

function docWith(event: Partial<CalendarEvent>) {
  return emptyCalendarDoc({
    calendars: [{ id: 'c', title: 'C', color: '#000', visible: true }],
    events: [
      {
        id: 'e',
        calendarId: 'c',
        title: 'E',
        start: '2026-01-05T09:00',
        end: '2026-01-05T10:00',
        allDay: false,
        ...event,
      },
    ],
  });
}

const days = (doc: ReturnType<typeof docWith>, start: string, end: string) =>
  occurrences(doc, { start, end }).map((o) => o.start.slice(0, 10));

describe('recurrence regressions', () => {
  it('weekly BYDAY expands every listed weekday', () => {
    const doc = docWith({ rrule: { freq: 'weekly', interval: 1, byweekday: [0, 2, 4] } });
    expect(days(doc, '2026-01-05', '2026-01-12')).toStrictEqual([
      '2026-01-05',
      '2026-01-07',
      '2026-01-09',
    ]);
  });

  it('monthly on the 31st skips short months instead of drifting', () => {
    const doc = docWith({
      start: '2026-01-31T09:00',
      end: '2026-01-31T10:00',
      rrule: { freq: 'monthly', interval: 1 },
    });
    expect(days(doc, '2026-01-01', '2026-06-01')).toStrictEqual([
      '2026-01-31',
      '2026-03-31',
      '2026-05-31',
    ]);
  });

  it('long-running daily series still reaches the visible range', () => {
    const doc = docWith({
      start: '2015-01-01T09:00',
      end: '2015-01-01T10:00',
      rrule: { freq: 'daily', interval: 1 },
    });
    expect(days(doc, '2026-01-05', '2026-01-07')).toStrictEqual(['2026-01-05', '2026-01-06']);
  });

  it('non-positive interval does not loop or duplicate', () => {
    const doc = docWith({ rrule: { freq: 'daily', interval: -1 } });
    expect(days(doc, '2026-01-05', '2026-01-08')).toStrictEqual([
      '2026-01-05',
      '2026-01-06',
      '2026-01-07',
    ]);
  });
});

describe('date helpers', () => {
  it('addMonths clamps the day and crosses years', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-01', 12)).toBe('2025-01-01');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
  });

  it('civilToEpoch honours the doc timezone incl. DST', () => {
    expect(civilToEpoch('2026-07-01T09:00', 'UTC')).toBe(Date.UTC(2026, 6, 1, 9));
    expect(civilToEpoch('2026-07-01T09:00', 'America/New_York')).toBe(Date.UTC(2026, 6, 1, 13));
    expect(civilToEpoch('2026-01-01T09:00', 'America/New_York')).toBe(Date.UTC(2026, 0, 1, 14));
  });
});

describe('ics all-day DTEND', () => {
  it('exports exclusive DTEND and round-trips the inclusive end', () => {
    const doc = docWith({ allDay: true, start: '2026-10-01', end: '2026-10-02' });
    const ics = serializeIcs(doc);
    expect(ics).toContain('DTEND;VALUE=DATE:20261003');
    expect(parseIcs(ics).events[0]?.end).toBe('2026-10-02');
  });
});
