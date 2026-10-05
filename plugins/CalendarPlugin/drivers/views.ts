import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';

import type { CalendarDoc, CalendarI18n, Occurrence } from '../types';
import { addDays, civilDate, formatEventWhen, startOfWeek } from './defaults';
import { agendaRange, dayRange, monthRange, occurrences, weekRange } from './occurrences';

export type ViewRenderCtx = {
  i18n: CalendarI18n;
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onSelectDay: (cursor: string) => void;
  onChangeView: (view: CalendarDoc['view'], cursor?: string) => void;
  onMoveTimed?: (eventId: string, day: string, startMinutes: number) => void;
  onResizeTimed?: (eventId: string, endMinutes: number) => void;
  onMoveDay?: (eventId: string, day: string) => void;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function layerColor(doc: CalendarDoc, calendarId: string, fallback?: string): string {
  return fallback ?? doc.calendars.find((c) => c.id === calendarId)?.color ?? '#3b82f6';
}

function eventIdFromTransfer(dt: DataTransfer | null): string {
  if (!dt) {
    return '';
  }
  return dt.getData('text/ocm-event-id') || dt.getData('text/plain') || '';
}

function occChip(doc: CalendarDoc, occ: Occurrence, ctx: ViewRenderCtx, extraClass = ''): ViewSpec {
  const selected = ctx.selectedEventId === occ.eventId;
  const color = layerColor(doc, occ.calendarId, occ.color);
  return h(
    'button',
    {
      class: `cal-occ${selected ? ' is-selected' : ''} ${extraClass}`.trim(),
      attrs: {
        type: 'button',
        'data-ocm-event-id': occ.eventId,
        title: occ.title,
        draggable: 'true',
      },
      style: {
        borderLeftColor: color,
        background: selected ? `${color}33` : `${color}18`,
      },
      on: {
        click: (e: Event) => {
          e.stopPropagation();
          ctx.onSelectEvent(occ.eventId);
        },
        dragstart: (e: Event) => {
          if (!(e instanceof DragEvent) || !e.dataTransfer) {
            return;
          }
          e.dataTransfer.setData('text/ocm-event-id', occ.eventId);
          e.dataTransfer.setData('text/plain', occ.eventId);
        },
      },
    },
    occ.allDay ? occ.title : `${occ.start.slice(11, 16)} ${occ.title}`
  );
}

export function renderMonth(doc: CalendarDoc, ctx: ViewRenderCtx): ViewSpec {
  const range = monthRange(doc.cursor);
  const occs = occurrences(doc, range);
  const byDay = new Map<string, Occurrence[]>();
  for (const o of occs) {
    const d = civilDate(o.start);
    const list = byDay.get(d) ?? [];
    list.push(o);
    byDay.set(d, list);
  }
  const parts = doc.cursor.split('-');
  const y = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 1;
  const cells: ViewSpec[] = [];
  let day = range.start;
  for (let i = 0; i < 42; i++) {
    const inMonth = day.startsWith(`${y}-${String(m).padStart(2, '0')}`);
    const isCursor = day === doc.cursor;
    const dayOccs = byDay.get(day) ?? [];
    const dayCapture = day;
    cells.push(
      h(
        'div',
        {
          class: `cal-month-cell${inMonth ? '' : ' is-outside'}${isCursor ? ' is-cursor' : ''}`,
          attrs: { 'data-ocm-day': dayCapture },
          on: {
            click: () => {
              ctx.onSelectDay(dayCapture);
            },
            dragover: (e: Event) => {
              e.preventDefault();
            },
            drop: (e: Event) => {
              e.preventDefault();
              if (!(e instanceof DragEvent)) {
                return;
              }
              const id = eventIdFromTransfer(e.dataTransfer);
              if (id.length > 0 && ctx.onMoveDay) {
                ctx.onMoveDay(id, dayCapture);
              }
            },
          },
        },
        h('div', { class: 'cal-month-cell__num' }, String(Number(day.slice(8, 10)))),
        h(
          'div',
          { class: 'cal-month-cell__events' },
          ...dayOccs.slice(0, 3).map((o) => occChip(doc, o, ctx, 'cal-occ--month')),
          dayOccs.length > 3
            ? h('div', { class: 'cal-month-more' }, `+${dayOccs.length - 3}`)
            : null
        )
      )
    );
    day = addDays(day, 1);
  }
  return h(
    'div',
    { class: 'cal-month' },
    h(
      'div',
      { class: 'cal-month__head' },
      ...WEEKDAYS.map((w) => h('div', { class: 'cal-month__dow' }, w))
    ),
    h('div', { class: 'cal-month__grid' }, ...cells)
  );
}

function minutesFromMidnight(iso: string): number {
  if (!iso.includes('T')) {
    return 0;
  }
  const parts = iso.slice(11, 16).split(':');
  return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
}

function snap15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

/** Shared timed column grid: week = 7 cols, day = 1. */
export function renderTimed(doc: CalendarDoc, ctx: ViewRenderCtx, cols: 1 | 7): ViewSpec {
  const range = cols === 1 ? dayRange(doc.cursor) : weekRange(doc.cursor);
  const allOccs = occurrences(doc, range);
  const occs = allOccs.filter((o) => !o.allDay);
  const allDayOccs = allOccs.filter((o) => o.allDay);
  const start = cols === 1 ? doc.cursor : startOfWeek(doc.cursor, 1);
  const days: string[] = [];
  for (let i = 0; i < cols; i++) {
    days.push(addDays(start, i));
  }
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return h(
    'div',
    { class: `cal-timed cal-timed--cols-${cols}` },
    h(
      'div',
      { class: 'cal-timed__allday' },
      h('div', { class: 'cal-timed__gutter' }, ctx.i18n.t('calendar.allDay') || 'All day'),
      ...days.map((day) =>
        h(
          'div',
          {
            class: 'cal-timed__allday-col',
            attrs: { 'data-ocm-day': day },
            on: {
              click: () => {
                ctx.onSelectDay(day);
              },
              dragover: (e: Event) => {
                e.preventDefault();
              },
              drop: (e: Event) => {
                e.preventDefault();
                if (!(e instanceof DragEvent)) {
                  return;
                }
                const id = eventIdFromTransfer(e.dataTransfer);
                if (id.length > 0 && ctx.onMoveDay) {
                  ctx.onMoveDay(id, day);
                }
              },
            },
          },
          ...allDayOccs
            .filter((o) => civilDate(o.start) <= day && civilDate(o.end) >= day)
            .map((o) => occChip(doc, o, ctx, 'cal-occ--allday'))
        )
      )
    ),
    h(
      'div',
      { class: 'cal-timed__scroll' },
      h(
        'div',
        { class: 'cal-timed__body' },
        h(
          'div',
          { class: 'cal-timed__gutter cal-timed__gutter--hours' },
          ...hours.map((hr) =>
            h('div', { class: 'cal-timed__hour' }, `${String(hr).padStart(2, '0')}:00`)
          )
        ),
        ...days.map((day) => {
          const dayOccs = occs.filter((x) => civilDate(x.start) === day);
          return h(
            'div',
            {
              class: 'cal-timed__col',
              attrs: { 'data-ocm-day': day },
              style: { minHeight: `${24 * 48}px` },
              on: {
                dragover: (e: Event) => {
                  e.preventDefault();
                },
                drop: (e: Event) => {
                  e.preventDefault();
                  if (!(e instanceof DragEvent) || !ctx.onMoveTimed) {
                    return;
                  }
                  const id = eventIdFromTransfer(e.dataTransfer);
                  if (id.length === 0) {
                    return;
                  }
                  const col = e.currentTarget;
                  if (!(col instanceof HTMLElement)) {
                    return;
                  }
                  const rect = col.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const minutes = snap15((y / 48) * 60);
                  ctx.onMoveTimed(id, day, Math.max(0, Math.min(23 * 60 + 45, minutes)));
                },
              },
            },
            ...hours.map((hr) =>
              h('div', {
                class: 'cal-timed__slot',
                style: { top: `${hr * 48}px` },
                on: {
                  click: () => {
                    ctx.onSelectDay(day);
                  },
                },
              })
            ),
            ...dayOccs.map((o) => {
              const top = (minutesFromMidnight(o.start) / 60) * 48;
              const height = Math.max(
                24,
                ((minutesFromMidnight(o.end) - minutesFromMidnight(o.start)) / 60) * 48
              );
              const color = layerColor(doc, o.calendarId, o.color);
              const selected = ctx.selectedEventId === o.eventId;
              return h(
                'div',
                {
                  class: `cal-timed__event${selected ? ' is-selected' : ''}`,
                  attrs: { 'data-ocm-event-id': o.eventId, draggable: 'true' },
                  style: {
                    top: `${top}px`,
                    height: `${height}px`,
                    borderLeftColor: color,
                    background: `${color}33`,
                  },
                  on: {
                    click: (e: Event) => {
                      e.stopPropagation();
                      ctx.onSelectEvent(o.eventId);
                    },
                    dragstart: (e: Event) => {
                      if (e instanceof DragEvent) {
                        e.dataTransfer?.setData('text/ocm-event-id', o.eventId);
                      }
                    },
                    pointerdown: (e: Event) => {
                      if (!(e instanceof PointerEvent)) {
                        return;
                      }
                      const target = e.target;
                      if (
                        !(target instanceof HTMLElement) ||
                        !target.classList.contains('cal-timed__resize')
                      ) {
                        return;
                      }
                      e.preventDefault();
                      e.stopPropagation();
                      const el = e.currentTarget;
                      if (!(el instanceof HTMLElement)) {
                        return;
                      }
                      const startY = e.clientY;
                      const startEnd = minutesFromMidnight(o.end);
                      const onMove = (ev: PointerEvent) => {
                        const dy = ev.clientY - startY;
                        const deltaMin = snap15((dy / 48) * 60);
                        ctx.onResizeTimed?.(
                          o.eventId,
                          Math.max(startEnd + deltaMin, minutesFromMidnight(o.start) + 15)
                        );
                      };
                      const onUp = () => {
                        el.releasePointerCapture(e.pointerId);
                        el.removeEventListener('pointermove', onMove);
                        el.removeEventListener('pointerup', onUp);
                      };
                      el.setPointerCapture(e.pointerId);
                      el.addEventListener('pointermove', onMove);
                      el.addEventListener('pointerup', onUp);
                    },
                  },
                },
                h('div', { class: 'cal-timed__event-title' }, o.title),
                h('div', { class: 'cal-timed__resize' })
              );
            })
          );
        })
      )
    )
  );
}

export function renderYear(doc: CalendarDoc, ctx: ViewRenderCtx): ViewSpec {
  const y = Number(doc.cursor.slice(0, 4));
  const months: ViewSpec[] = [];
  for (let m = 1; m <= 12; m++) {
    const cursor = `${y}-${String(m).padStart(2, '0')}-01`;
    const count = occurrences(doc, monthRange(cursor)).length;
    months.push(
      h(
        'button',
        {
          class: 'cal-year-month',
          attrs: { type: 'button' },
          on: {
            click: () => {
              ctx.onChangeView('month', cursor);
            },
          },
        },
        h('div', { class: 'cal-year-month__name' }, cursor.slice(0, 7)),
        h('div', { class: 'cal-year-month__count' }, String(count))
      )
    );
  }
  return h('div', { class: 'cal-year' }, ...months);
}

export function renderAgenda(doc: CalendarDoc, ctx: ViewRenderCtx): ViewSpec {
  const occs = occurrences(doc, agendaRange(doc.cursor, 30));
  if (occs.length === 0) {
    return h('p', { class: 'cal-ws-empty' }, ctx.i18n.t('calendar.noEvents') || 'No events');
  }
  return h(
    'div',
    { class: 'cal-agenda' },
    ...occs.map((o) =>
      h(
        'button',
        {
          class: `cal-agenda__row${ctx.selectedEventId === o.eventId ? ' is-selected' : ''}`,
          attrs: { type: 'button', 'data-ocm-event-id': o.eventId },
          on: {
            click: () => {
              ctx.onSelectEvent(o.eventId);
            },
          },
        },
        h('div', { class: 'cal-agenda__when' }, formatEventWhen(o.start, o.allDay, doc.tz)),
        h('div', { class: 'cal-agenda__title' }, o.title)
      )
    )
  );
}

export function renderView(doc: CalendarDoc, ctx: ViewRenderCtx): ViewSpec {
  if (doc.view === 'week') {
    return renderTimed(doc, ctx, 7);
  }
  if (doc.view === 'day') {
    return renderTimed(doc, ctx, 1);
  }
  if (doc.view === 'year') {
    return renderYear(doc, ctx);
  }
  if (doc.view === 'agenda') {
    return renderAgenda(doc, ctx);
  }
  return renderMonth(doc, ctx);
}
