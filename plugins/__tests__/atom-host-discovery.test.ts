/**
 * @jest-environment jsdom
 */
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { createDoc, createParagraph, createText } from '@codemerge/kernel';
import { Editor } from '@ocm/wysiwyg/editor/Editor';
import { pathFromEl, queryAtomHosts } from '@ocm/wysiwyg/utils/atomPath';
import { CalendarPlugin } from '../CalendarPlugin';
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

  it('calendar atom remounts via queryAtomHosts after payload set_attrs', () => {
    expect.hasAssertions();
    host = document.createElement('div');
    document.body.append(host);

    editor = new Editor(host, { plugins: [CalendarPlugin()] });
    editor.setJSON(
      createDoc([
        createParagraph([createText('before')]),
        {
          type: 'calendar',
          attrs: {
            title: 'test',
            align: '',
            payload: {
              title: 'test',
              tz: 'UTC',
              view: 'month',
              cursor: '2026-09-28',
              calendars: [{ id: 'c1', title: 'test', color: '#3b82f6', visible: true }],
              events: [],
            },
          },
        },
      ])
    );

    expect(host.querySelectorAll('.ocm-calendar')).toHaveLength(0);
    expect(queryAtomHosts(host, 'calendar')).toHaveLength(1);
    expect(host.querySelector('.ocm-calendar-atom')).toBeTruthy();
    expect(host.querySelector('[data-ocm-type="calendar"]')).toBeTruthy();
    expect(host.querySelector('.calendar-empty')).toBeTruthy();

    const path = pathFromEl(queryAtomHosts(host, 'calendar')[0]!);
    expect(path).toStrictEqual([1]);

    editor.run(() => [
      {
        type: 'set_attrs',
        path: path!,
        attrs: {
          title: 'test',
          payload: {
            title: 'test',
            tz: 'UTC',
            view: 'month',
            cursor: '2026-09-28',
            calendars: [{ id: 'c1', title: 'test', color: '#3b82f6', visible: true }],
            events: [
              {
                id: 'e1',
                calendarId: 'c1',
                title: 'тест',
                start: '2026-09-28T14:00',
                end: '2026-09-28T15:00',
                allDay: false,
              },
            ],
          },
        },
      },
    ]);

    expect(host.querySelector('.calendar-empty')).toBeNull();
    expect(host.textContent).toContain('тест');

    const payload = editor.getJSON().doc.content?.[1]?.attrs?.payload as {
      events?: { title?: string }[];
    };
    expect(payload?.events?.[0]?.title).toBe('тест');
  });
});
