import { describe, expect, it } from 'vitest';
import { emptyCalendarDoc } from '../drivers/defaults';
import { occurrences, weekRange, monthRange } from '../drivers/occurrences';

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
});
