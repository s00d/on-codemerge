import { describe, expect, it } from 'vitest';
import { renderDetached } from '@codemerge/sdk';
import { emptyCalendarDoc } from '../drivers/defaults';
import { renderView } from '../drivers/views';
import { eventInspector } from '../drivers/eventInspector';

const stub = {
  i18n: { t: (k: string) => k },
  selectedEventId: null as string | null,
  onSelectEvent: () => {},
  onSelectDay: () => {},
  onChangeView: () => {},
};

describe('views.smoke', () => {
  it('renderDetached month/timed/year/agenda', () => {
    const base = emptyCalendarDoc({
      cursor: '2026-10-02',
      calendars: [{ id: 'c', title: 'C', color: '#3b82f6', visible: true }],
      events: [
        {
          id: 'e1',
          calendarId: 'c',
          title: 'Standup',
          start: '2026-10-02T09:00',
          end: '2026-10-02T09:30',
          allDay: false,
        },
      ],
    });

    for (const view of ['month', 'week', 'day', 'year', 'agenda'] as const) {
      const { el } = renderDetached(renderView({ ...base, view }, stub));
      expect(el).toBeTruthy();
      const has = (sel: string) => el.matches(sel) || Boolean(el.querySelector(sel));
      if (view === 'month') {
        expect(has('.cal-month')).toBe(true);
      }
      if (view === 'week' || view === 'day') {
        expect(has('.cal-timed')).toBe(true);
      }
      if (view === 'year') {
        expect(has('.cal-year')).toBe(true);
      }
      if (view === 'agenda') {
        expect(has('.cal-agenda')).toBe(true);
      }
    }
  });

  it('eventInspector allDay coerce', () => {
    const doc = emptyCalendarDoc({
      calendars: [{ id: 'c', title: 'C', color: '#000', visible: true }],
      events: [
        {
          id: 'e1',
          calendarId: 'c',
          title: 'X',
          start: '2026-10-02T09:00',
          end: '2026-10-02T10:00',
          allDay: false,
        },
      ],
    });
    let patched: Record<string, unknown> | null = null;
    const { el } = renderDetached(
      eventInspector({
        doc,
        event: doc.events[0]!,
        layer: null,
        i18n: { t: (k) => k },
        onPatchEvent: (_id, patch) => {
          patched = patch as Record<string, unknown>;
        },
        onRemoveEvent: () => {},
        onPatchLayer: () => {},
      })
    );
    const check = el.querySelector('input[type="checkbox"]');
    expect(check).toBeTruthy();
    if (check instanceof HTMLInputElement) {
      check.checked = true;
      check.dispatchEvent(new Event('change', { bubbles: true }));
    }
    expect(patched?.allDay).toBe(true);
    expect(String(patched?.start)).toBe('2026-10-02');
  });
});
