import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';

import type {
  CalendarDoc,
  CalendarEvent,
  CalendarI18n,
  CalendarLayer,
  CalendarRRule,
} from '../types';

export type EventInspectorCtx = {
  doc: CalendarDoc;
  event: CalendarEvent | null;
  layer: CalendarLayer | null;
  i18n: CalendarI18n;
  onPatchEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  onRemoveEvent: (id: string) => void;
  onPatchLayer: (id: string, patch: Partial<CalendarLayer>) => void;
};

function field(label: string, input: ViewSpec): ViewSpec {
  return h(
    'label',
    { class: 'cal-insp__field' },
    h('span', { class: 'cal-insp__label' }, label),
    input
  );
}

function textInput(
  value: string,
  onInput: (v: string) => void,
  attrs: Record<string, string> = {}
): ViewSpec {
  return h('input', {
    class: 'cal-insp__input',
    attrs: { type: 'text', value, ...attrs },
    on: {
      input: (e: Event) => {
        const t = e.target;
        if (t instanceof HTMLInputElement) {
          onInput(t.value);
        }
      },
    },
  });
}

function isFreq(value: string): value is CalendarRRule['freq'] {
  return value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'yearly';
}

export function eventInspector(ctx: EventInspectorCtx): ViewSpec {
  const t = (k: string, fb: string) => ctx.i18n.t(k) || fb;

  if (ctx.layer && !ctx.event) {
    const layer = ctx.layer;
    return h(
      'div',
      { class: 'cal-insp' },
      h('div', { class: 'cal-insp__title' }, t('calendar.editCalendar', 'Calendar')),
      field(
        t('calendar.calendarTitle', 'Title'),
        textInput(layer.title, (v) => {
          ctx.onPatchLayer(layer.id, { title: v });
        })
      ),
      field(
        t('calendar.color', 'Color'),
        textInput(
          layer.color,
          (v) => {
            ctx.onPatchLayer(layer.id, { color: v || '#3b82f6' });
          },
          { placeholder: '#3b82f6' }
        )
      ),
      h(
        'label',
        { class: 'cal-insp__check' },
        h('input', {
          attrs: { type: 'checkbox', ...(layer.visible ? { checked: '' } : {}) },
          on: {
            change: (e: Event) => {
              const el = e.target;
              if (el instanceof HTMLInputElement) {
                ctx.onPatchLayer(layer.id, { visible: el.checked });
              }
            },
          },
        }),
        t('calendar.visible', 'Visible')
      )
    );
  }

  if (!ctx.event) {
    return h(
      'p',
      { class: 'cal-ws-empty' },
      t('calendar.selectEventOrLayer', 'Select an event or calendar layer')
    );
  }

  const event = ctx.event;
  const patch = (p: Partial<CalendarEvent>) => {
    ctx.onPatchEvent(event.id, p);
  };

  const rruleEnabled = Boolean(event.rrule);
  const rrule: CalendarRRule = event.rrule ?? { freq: 'weekly', interval: 1 };

  return h(
    'div',
    { class: 'cal-insp' },
    h('div', { class: 'cal-insp__title' }, t('calendar.editEvent', 'Event')),
    field(
      t('calendar.eventTitle', 'Title'),
      textInput(event.title, (v) => {
        patch({ title: v });
      })
    ),
    h(
      'label',
      { class: 'cal-insp__check' },
      h('input', {
        attrs: { type: 'checkbox', ...(event.allDay ? { checked: '' } : {}) },
        on: {
          change: (e: Event) => {
            const el = e.target;
            if (!(el instanceof HTMLInputElement)) {
              return;
            }
            if (el.checked) {
              patch({
                allDay: true,
                start: event.start.slice(0, 10),
                end: event.end.slice(0, 10),
              });
            } else {
              const d = event.start.slice(0, 10);
              patch({ allDay: false, start: `${d}T09:00`, end: `${d}T10:00` });
            }
          },
        },
      }),
      t('calendar.allDayEvent', 'All day')
    ),
    field(
      t('calendar.start', 'Start'),
      h('input', {
        class: 'cal-insp__input',
        attrs: {
          type: event.allDay ? 'date' : 'datetime-local',
          value: event.allDay ? event.start.slice(0, 10) : event.start.slice(0, 16),
        },
        on: {
          input: (e: Event) => {
            const el = e.target;
            if (el instanceof HTMLInputElement) {
              patch({ start: el.value });
            }
          },
        },
      })
    ),
    field(
      t('calendar.end', 'End'),
      h('input', {
        class: 'cal-insp__input',
        attrs: {
          type: event.allDay ? 'date' : 'datetime-local',
          value: event.allDay ? event.end.slice(0, 10) : event.end.slice(0, 16),
        },
        on: {
          input: (e: Event) => {
            const el = e.target;
            if (el instanceof HTMLInputElement) {
              patch({ end: el.value });
            }
          },
        },
      })
    ),
    field(
      t('calendar.location', 'Location'),
      textInput(event.location ?? '', (v) => {
        patch({ location: v || undefined });
      })
    ),
    field(
      t('calendar.description', 'Description'),
      h(
        'textarea',
        {
          class: 'cal-insp__input cal-insp__textarea',
          attrs: { rows: '3' },
          on: {
            input: (e: Event) => {
              const el = e.target;
              if (el instanceof HTMLTextAreaElement) {
                patch({ description: el.value || undefined });
              }
            },
          },
        },
        event.description ?? ''
      )
    ),
    field(
      t('calendar.calendarLayer', 'Calendar'),
      h(
        'select',
        {
          class: 'cal-insp__input',
          on: {
            change: (e: Event) => {
              const el = e.target;
              if (el instanceof HTMLSelectElement) {
                patch({ calendarId: el.value });
              }
            },
          },
        },
        ...ctx.doc.calendars.map((c) =>
          h(
            'option',
            {
              attrs: {
                value: c.id,
                ...(c.id === event.calendarId ? { selected: '' } : {}),
              },
            },
            c.title
          )
        )
      )
    ),
    field(
      t('calendar.reminderMinutesBefore', 'Reminder (min)'),
      h('input', {
        class: 'cal-insp__input',
        attrs: {
          type: 'number',
          min: '0',
          value: event.reminder !== undefined ? String(event.reminder) : '',
        },
        on: {
          input: (e: Event) => {
            const el = e.target;
            if (!(el instanceof HTMLInputElement)) {
              return;
            }
            patch({ reminder: el.value === '' ? undefined : Number(el.value) });
          },
        },
      })
    ),
    h(
      'label',
      { class: 'cal-insp__check' },
      h('input', {
        attrs: { type: 'checkbox', ...(rruleEnabled ? { checked: '' } : {}) },
        on: {
          change: (e: Event) => {
            const el = e.target;
            if (!(el instanceof HTMLInputElement)) {
              return;
            }
            if (el.checked) {
              patch({ rrule: { freq: 'weekly', interval: 1 } });
            } else {
              patch({ rrule: undefined });
            }
          },
        },
      }),
      t('calendar.recurring', 'Recurring')
    ),
    rruleEnabled
      ? h(
          'div',
          { class: 'cal-insp__rrule' },
          field(
            t('calendar.freq', 'Frequency'),
            h(
              'select',
              {
                class: 'cal-insp__input',
                on: {
                  change: (e: Event) => {
                    const el = e.target;
                    if (!(el instanceof HTMLSelectElement) || !isFreq(el.value)) {
                      return;
                    }
                    patch({ rrule: { ...rrule, freq: el.value } });
                  },
                },
              },
              ...(['daily', 'weekly', 'monthly', 'yearly'] as const).map((f) =>
                h(
                  'option',
                  {
                    attrs: {
                      value: f,
                      ...(rrule.freq === f ? { selected: '' } : {}),
                    },
                  },
                  f
                )
              )
            )
          ),
          field(
            t('calendar.interval', 'Interval'),
            h('input', {
              class: 'cal-insp__input',
              attrs: { type: 'number', min: '1', value: String(rrule.interval) },
              on: {
                input: (e: Event) => {
                  const el = e.target;
                  if (!(el instanceof HTMLInputElement)) {
                    return;
                  }
                  patch({
                    rrule: {
                      ...rrule,
                      interval: Math.max(1, Number(el.value) || 1),
                    },
                  });
                },
              },
            })
          ),
          field(
            t('calendar.until', 'Until'),
            h('input', {
              class: 'cal-insp__input',
              attrs: { type: 'date', value: rrule.until?.slice(0, 10) ?? '' },
              on: {
                input: (e: Event) => {
                  const el = e.target;
                  if (!(el instanceof HTMLInputElement)) {
                    return;
                  }
                  patch({ rrule: { ...rrule, until: el.value || undefined } });
                },
              },
            })
          )
        )
      : null,
    h(
      'button',
      {
        class: 'cal-insp__danger',
        attrs: { type: 'button' },
        on: {
          click: () => {
            ctx.onRemoveEvent(event.id);
          },
        },
      },
      t('calendar.deleteEvent', 'Delete event')
    )
  );
}
