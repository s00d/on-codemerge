/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { createDoc, createParagraph, createText } from '@on-codemerge/kernel';
import { Editor } from '@ocm/wysiwyg/editor/Editor';
import { pathFromEl, queryAtomHosts } from '@ocm/wysiwyg/utils/atomPath';
import { CalendarPlugin } from '../CalendarPlugin';
import { CalendarManager } from '../CalendarPlugin/services/CalendarManager';
import { TimerPlugin } from '../TimerPlugin';

describe('atom host discovery (data-ocm-type + ocm-*-atom)', () => {
  let host: HTMLElement;
  let editor: Editor;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    editor?.destroy?.();
    host?.remove();
    localStorage.clear();
  });

  it('CE atom shells expose data-ocm-type matching data-type', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);
    editor = new Editor(host, { plugins: [TimerPlugin()] });
    const target = new Date(Date.now() + 86_400_000).toISOString();
    editor.setJSON(
      createDoc([
        {
          type: 'timer',
          attrs: {
            title: 'Ship',
            align: '',
            payload: {
              id: 't-disc-1',
              title: 'Ship',
              description: '',
              targetDate: target,
              targetTime: '12:00',
              color: '#0284c7',
              category: '',
              tags: [],
            },
          },
        },
      ])
    );

    const atom = host.querySelector<HTMLElement>('[data-ocm-atom="1"]');
    expect(atom?.dataset.type).toBe('timer');
    expect(atom?.dataset.ocmType).toBe('timer');
    expect(queryAtomHosts(host, 'timer')).toHaveLength(1);
    expect(pathFromEl(queryAtomHosts(host, 'timer')[0]!)).toStrictEqual([0]);
  });

  it('calendar event persist remounts via queryAtomHosts (legacy .ocm-calendar misses)', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);

    // Same localStorage keys as CalendarPlugin's manager.
    const seed = new CalendarManager();
    const cal = seed.createCalendar({ title: 'test', description: '' });

    editor = new Editor(host, { plugins: [CalendarPlugin()] });
    editor.setJSON(
      createDoc([
        createParagraph([createText('before')]),
        {
          type: 'calendar',
          attrs: {
            title: cal.title,
            calendarId: cal.id,
            align: '',
            payload: { calendar: cal, events: [] },
          },
        },
      ])
    );

    // Legacy broken selector used by CalendarPlugin before the fix.
    expect(host.querySelectorAll('.ocm-calendar')).toHaveLength(0);
    expect(queryAtomHosts(host, 'calendar')).toHaveLength(1);
    expect(host.querySelector('.ocm-calendar-atom')).toBeTruthy();
    expect(host.querySelector('[data-ocm-type="calendar"]')).toBeTruthy();
    expect(host.querySelector('.calendar-empty')).toBeTruthy();

    seed.createEvent(
      {
        title: 'тест',
        description: '',
        date: '2026-09-28',
        time: '14:00',
        duration: 60,
        color: '#3b82f6',
        priority: 'low',
      },
      cal.id
    );

    const path = pathFromEl(queryAtomHosts(host, 'calendar')[0]!);
    expect(path).toStrictEqual([1]);

    // What refreshWidgets → persistOpenCalendars must do after createEvent.
    editor.run(() => [
      {
        type: 'set_attrs',
        path: path!,
        attrs: {
          payload: { calendar: cal, events: seed.getEvents(cal.id) },
          title: cal.title,
        },
      },
    ]);

    expect(host.querySelector('.calendar-empty')).toBeNull();
    expect(host.querySelector('.calendar-event')).toBeTruthy();
    expect(host.textContent).toContain('тест');

    const payload = editor.getJSON().doc.content?.[1]?.attrs?.payload as {
      events?: { title?: string }[];
    };
    expect(payload?.events?.[0]?.title).toBe('тест');
  });
});
