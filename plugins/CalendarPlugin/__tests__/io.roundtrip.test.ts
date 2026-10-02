import { describe, expect, it } from 'vitest';
import {
  emptyEditorDoc,
  parseText,
  serializeDoc,
  parseIcs,
  serializeIcs,
  importCalendarText,
} from '../io';
import { coerceCalendarDoc, emptyCalendarDoc } from '../drivers/defaults';
import { isCalendarDoc } from '../types';

describe('io.roundtrip', () => {
  it('emptyEditorDoc → serialize → parse keeps events', () => {
    const payload = emptyCalendarDoc({
      title: 'Demo',
      events: [
        {
          id: 'e1',
          calendarId: 'c1',
          title: 'Meet',
          start: '2026-10-02T09:00',
          end: '2026-10-02T10:00',
          allDay: false,
        },
      ],
      calendars: [{ id: 'c1', title: 'Work', color: '#3b82f6', visible: true }],
    });
    const doc = emptyEditorDoc(payload);
    const text = serializeDoc(doc);
    const parsed = parseText(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.doc.type).toBe('doc');
    const cal = parsed.doc.content?.[0];
    expect(cal?.type).toBe('calendar');
    const body = cal?.attrs?.payload as typeof payload;
    expect(body.title).toBe('Demo');
    expect(body.events).toHaveLength(1);
    expect(body.events[0]?.title).toBe('Meet');
  });

  it('coerce legacy { calendar, events } with date/time/duration', () => {
    const doc = coerceCalendarDoc({
      calendar: { id: 'x', title: 'Legacy' },
      events: [
        {
          id: 'e1',
          title: 'Old',
          date: '2026-09-28',
          time: '14:00',
          duration: 60,
          isAllDay: false,
        },
      ],
    });
    expect(isCalendarDoc(doc)).toBe(true);
    expect(doc.title).toBe('Legacy');
    expect(doc.events[0]?.start).toBe('2026-09-28T14:00');
    expect(doc.events[0]?.end).toBe('2026-09-28T15:00');
  });

  it('ICS serialize → parse roundtrip titles', () => {
    const doc = emptyCalendarDoc({
      title: 'ICS Cal',
      calendars: [{ id: 'main', title: 'ICS Cal', color: '#111', visible: true }],
      events: [
        {
          id: 'uid-1',
          calendarId: 'main',
          title: 'Coffee',
          start: '2026-10-02T08:00',
          end: '2026-10-02T08:30',
          allDay: false,
        },
      ],
    });
    const ics = serializeIcs(doc);
    expect(ics).toContain('BEGIN:VEVENT');
    const back = parseIcs(ics);
    expect(back.title).toBe('ICS Cal');
    expect(back.events.some((e) => e.title === 'Coffee')).toBe(true);
    expect(importCalendarText(ics).events).toHaveLength(1);
  });
});
