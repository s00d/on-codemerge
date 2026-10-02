import { downloadBlob, h, mount, pickFile, studioPaneTabs, syncStudioPanel } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, MountHandle, ViewSpec } from '@codemerge/sdk';
import type { EditorState } from '@codemerge/kernel';
import type { CalendarDoc, CalendarView } from '../types';
import { isCalendarView } from '../types';
import {
  addDays,
  addEvent,
  addLayer,
  emptyCalendarDoc,
  emptyEvent,
  patchEvent,
  patchLayer,
  removeEvent,
  removeLayer,
  todayCursor,
  tzLabel,
} from '../drivers/defaults';
import { eventInspector } from '../drivers/eventInspector';
import { renderView } from '../drivers/views';
import { importCalendarText, serializeIcs, serializePayload } from '../io';
import { payloadFromDoc } from '../io/adapters';

export type CalendarWorkspaceHandle = {
  destroy: () => void;
  update: (state: EditorState) => void;
  getPayload: () => CalendarDoc;
  setPayload: (doc: CalendarDoc) => void;
  addEvent: () => void;
  clearEvents: () => void;
  setView: (view: CalendarView) => void;
  importText: (text: string) => void;
  exportJson: () => string;
  exportIcs: () => string;
};

export type MountCalendarWorkspaceOptions = {
  mode: 'workspace' | 'atom';
  initial?: CalendarDoc;
  scope: DisposableScope;
  onChange?: (doc: CalendarDoc) => void;
};

const VIEWS: CalendarView[] = ['month', 'week', 'day', 'year', 'agenda'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function fmtMinutes(m: number): string {
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

/**
 * Three-column calendar studio: layers | canvas | inspector.
 */
export function mountCalendarWorkspace(
  editor: EditorAPI,
  host: HTMLElement,
  opts: MountCalendarWorkspaceOptions
): CalendarWorkspaceHandle {
  let doc: CalendarDoc = opts.initial ? structuredClone(opts.initial) : emptyCalendarDoc();
  let selectedEventId: string | null = null;
  let selectedLayerId: string | null = doc.calendars[0]?.id ?? null;
  /** Mobile / narrow: which studio pane is focused (lg+ shows all three). */
  let mobilePanel: 'canvas' | 'palette' | 'inspector' = 'canvas';
  let suppressDocSync = false;
  let rootMount: MountHandle | null = null;
  let canvasMount: MountHandle | null = null;
  let inspectorMount: MountHandle | null = null;
  let paletteMount: MountHandle | null = null;
  let tabsMount: MountHandle | null = null;
  let canvasHost: HTMLElement | null = null;
  let inspectorHost: HTMLElement | null = null;
  let paletteHost: HTMLElement | null = null;
  let tabsHost: HTMLElement | null = null;
  let bodyEl: HTMLElement | null = null;

  const t = (k: string) => editor.t(k) || k;

  const emitChange = (): void => {
    opts.onChange?.(doc);
  };

  const commit = (next: CalendarDoc): void => {
    doc = next;
    suppressDocSync = true;
    emitChange();
    suppressDocSync = false;
    refreshAll();
  };

  const syncMobilePanel = (): void => {
    if (bodyEl) {
      syncStudioPanel(bodyEl, mobilePanel);
    }
    refreshTabs();
  };

  const setMobilePanel = (panel: 'canvas' | 'palette' | 'inspector'): void => {
    mobilePanel = panel;
    syncMobilePanel();
  };

  const viewCtx = () => ({
    i18n: { t },
    selectedEventId,
    onSelectEvent: (id: string) => {
      selectedEventId = id;
      selectedLayerId = null;
      mobilePanel = 'inspector';
      syncMobilePanel();
      refreshInspector();
      refreshCanvas();
      requestAnimationFrame(() => {
        const el = canvasHost?.querySelector(`[data-ocm-event-id="${CSS.escape(id)}"]`);
        if (el instanceof HTMLElement) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    },
    onSelectDay: (cursor: string) => {
      mobilePanel = 'canvas';
      syncMobilePanel();
      commit({ ...doc, cursor });
    },
    onChangeView: (view: CalendarView, cursor?: string) => {
      mobilePanel = 'canvas';
      syncMobilePanel();
      commit({ ...doc, view, ...(cursor ? { cursor } : {}) });
    },
    onMoveDay: (eventId: string, day: string) => {
      const ev = doc.events.find((e) => e.id === eventId);
      if (!ev) {
        return;
      }
      if (ev.allDay) {
        const span = Math.max(0, Date.parse(ev.end) - Date.parse(ev.start)) / 86_400_000 || 0;
        const end = addDays(day, Math.round(span));
        commit(patchEvent(doc, eventId, { start: day, end }));
        return;
      }
      const time = ev.start.includes('T') ? ev.start.slice(11, 16) : '09:00';
      const endTime = ev.end.includes('T') ? ev.end.slice(11, 16) : '10:00';
      commit(
        patchEvent(doc, eventId, {
          start: `${day}T${time}`,
          end: `${day}T${endTime}`,
        })
      );
    },
    onMoveTimed: (eventId: string, day: string, startMinutes: number) => {
      const ev = doc.events.find((e) => e.id === eventId);
      if (!ev || ev.allDay) {
        return;
      }
      const startMin =
        (Number(ev.start.slice(11, 13)) || 0) * 60 + (Number(ev.start.slice(14, 16)) || 0);
      const endMin = (Number(ev.end.slice(11, 13)) || 0) * 60 + (Number(ev.end.slice(14, 16)) || 0);
      const dur = endMin - startMin || 60;
      const endMinutes = startMinutes + Math.max(15, dur);
      commit(
        patchEvent(doc, eventId, {
          start: `${day}T${fmtMinutes(startMinutes)}`,
          end: `${day}T${fmtMinutes(Math.min(endMinutes, 23 * 60 + 45))}`,
        })
      );
    },
    onResizeTimed: (eventId: string, endMinutes: number) => {
      const ev = doc.events.find((e) => e.id === eventId);
      if (!ev || ev.allDay) {
        return;
      }
      const day = ev.start.slice(0, 10);
      commit(patchEvent(doc, eventId, { end: `${day}T${fmtMinutes(endMinutes)}` }));
    },
  });

  const refreshCanvas = (): void => {
    if (!canvasHost) {
      return;
    }
    canvasMount?.destroy();
    canvasMount = mount(canvasHost, renderView(doc, viewCtx()));
  };

  const refreshInspector = (): void => {
    if (!inspectorHost) {
      return;
    }
    inspectorMount?.destroy();
    const event = selectedEventId
      ? (doc.events.find((e) => e.id === selectedEventId) ?? null)
      : null;
    const layer =
      !event && selectedLayerId
        ? (doc.calendars.find((c) => c.id === selectedLayerId) ?? null)
        : null;
    inspectorMount = mount(
      inspectorHost,
      eventInspector({
        doc,
        event,
        layer,
        i18n: { t },
        onPatchEvent: (id, patch) => {
          commit(patchEvent(doc, id, patch));
        },
        onRemoveEvent: (id) => {
          selectedEventId = null;
          commit(removeEvent(doc, id));
        },
        onPatchLayer: (id, patch) => {
          commit(patchLayer(doc, id, patch));
        },
      })
    );
  };

  const refreshTabs = (): void => {
    if (!tabsHost) {
      return;
    }
    tabsMount?.destroy();
    tabsMount = mount(
      tabsHost,
      studioPaneTabs(
        [
          { id: 'canvas', label: t('calendar.title') || 'Calendar' },
          { id: 'palette', label: t('calendar.calendars') || 'Calendars' },
          { id: 'inspector', label: t('calendar.editEvent') || 'Edit' },
        ],
        mobilePanel,
        (id) => {
          if (id === 'canvas' || id === 'palette' || id === 'inspector') {
            setMobilePanel(id);
          }
        }
      )
    );
  };

  const refreshPalette = (): void => {
    if (!paletteHost) {
      return;
    }
    paletteMount?.destroy();
    const eventsSorted = doc.events.toSorted((a, b) => a.start.localeCompare(b.start)).slice(0, 40);
    paletteMount = mount(
      paletteHost,
      h(
        'div',
        { class: 'cal-ws-palette' },
        h('div', { class: 'cal-ws-panel__title' }, t('calendar.calendars') || 'Calendars'),
        ...doc.calendars.map((layer) =>
          h(
            'button',
            {
              class: `cal-ws-layer${selectedLayerId === layer.id && !selectedEventId ? ' is-selected' : ''}${layer.visible ? '' : ' is-hidden'}`,
              attrs: { type: 'button' },
              on: {
                click: () => {
                  selectedLayerId = layer.id;
                  selectedEventId = null;
                  setMobilePanel('inspector');
                  refreshInspector();
                  refreshPalette();
                },
              },
            },
            h('span', {
              class: 'cal-ws-layer__swatch',
              style: { background: layer.color },
            }),
            h('span', { class: 'cal-ws-layer__title' }, layer.title)
          )
        ),
        h(
          'button',
          {
            class: 'cal-ws-add',
            attrs: { type: 'button' },
            on: {
              click: () => {
                const next = addLayer(doc);
                selectedLayerId = next.calendars.at(-1)?.id ?? null;
                selectedEventId = null;
                setMobilePanel('inspector');
                commit(next);
              },
            },
          },
          t('calendar.newCalendar') || 'Add calendar'
        ),
        doc.calendars.length > 1
          ? h(
              'button',
              {
                class: 'cal-ws-add cal-ws-add--danger',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    if (!selectedLayerId) {
                      return;
                    }
                    const next = removeLayer(doc, selectedLayerId);
                    selectedLayerId = next.calendars[0]?.id ?? null;
                    commit(next);
                  },
                },
              },
              t('calendar.deleteCalendar') || 'Remove calendar'
            )
          : null,
        h('div', { class: 'cal-ws-panel__title' }, t('calendar.events') || 'Events'),
        h(
          'button',
          {
            class: 'cal-ws-add',
            attrs: { type: 'button' },
            on: {
              click: () => {
                handleAddEvent();
              },
            },
          },
          t('calendar.addEvent') || 'Add event'
        ),
        doc.events.length > 0
          ? h(
              'button',
              {
                class: 'cal-ws-add cal-ws-add--danger',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    selectedEventId = null;
                    commit({ ...doc, events: [] });
                  },
                },
              },
              t('calendar.clearEvents') || 'Clear events'
            )
          : null,
        eventsSorted.length === 0
          ? h(
              'div',
              { class: 'cal-ws-empty cal-ws-empty--sm' },
              t('calendar.noEvents') || 'No events'
            )
          : h(
              'div',
              { class: 'cal-ws-event-list' },
              ...eventsSorted.map((ev) => {
                const layer = doc.calendars.find((c) => c.id === ev.calendarId);
                return h(
                  'button',
                  {
                    class: `cal-ws-event${selectedEventId === ev.id ? ' is-selected' : ''}`,
                    attrs: { type: 'button', title: ev.start },
                    on: {
                      click: () => {
                        selectedEventId = ev.id;
                        selectedLayerId = null;
                        setMobilePanel('inspector');
                        refreshInspector();
                        refreshPalette();
                        refreshCanvas();
                      },
                    },
                  },
                  h('span', {
                    class: 'cal-ws-event__swatch',
                    style: { background: layer?.color ?? '#94a3b8' },
                  }),
                  h(
                    'span',
                    { class: 'cal-ws-event__body' },
                    h(
                      'span',
                      { class: 'cal-ws-event__title' },
                      ev.title || t('calendar.event') || 'Event'
                    ),
                    h(
                      'span',
                      { class: 'cal-ws-event__when' },
                      ev.start.slice(0, 16).replace('T', ' ')
                    )
                  )
                );
              })
            )
      )
    );
  };

  const shiftCursor = (dir: -1 | 1): void => {
    let days = 30 * dir;
    if (doc.view === 'week') {
      days = 7 * dir;
    } else if (doc.view === 'day' || doc.view === 'agenda') {
      days = dir;
    } else if (doc.view === 'year') {
      days = 365 * dir;
    }
    commit({ ...doc, cursor: addDays(doc.cursor, days) });
  };

  const refreshHeader = (headerHost: HTMLElement): void => {
    mount(
      headerHost,
      h(
        'div',
        { class: 'cal-ws-header' },
        h('input', {
          class: 'cal-ws-title',
          attrs: {
            type: 'text',
            value: doc.title,
            'aria-label': t('calendar.calendarTitle') || 'Title',
          },
          on: {
            change: (e: Event) => {
              const el = e.target;
              if (el instanceof HTMLInputElement) {
                commit({ ...doc, title: el.value });
              }
            },
          },
        }),
        h(
          'div',
          { class: 'cal-ws-views cal-ws-views--chips' },
          ...VIEWS.map((view) =>
            h(
              'button',
              {
                class: `cal-ws-view${doc.view === view ? ' is-active' : ''}`,
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    commit({ ...doc, view });
                  },
                },
              },
              view
            )
          )
        ),
        h(
          'select',
          {
            class: 'cal-ws-views-select',
            attrs: { 'aria-label': 'View' },
            on: {
              change: (e: Event) => {
                const el = e.target;
                if (!(el instanceof HTMLSelectElement)) {
                  return;
                }
                const next = el.value;
                if (isCalendarView(next)) {
                  commit({ ...doc, view: next });
                }
              },
            },
          },
          ...VIEWS.map((view) =>
            h(
              'option',
              { attrs: { value: view, ...(doc.view === view ? { selected: '' } : {}) } },
              view
            )
          )
        ),
        h(
          'div',
          { class: 'cal-ws-nav' },
          h(
            'button',
            {
              attrs: { type: 'button', 'aria-label': 'Previous' },
              on: {
                click: () => {
                  shiftCursor(-1);
                },
              },
            },
            '‹'
          ),
          h(
            'button',
            {
              attrs: { type: 'button' },
              on: {
                click: () => {
                  commit({ ...doc, cursor: todayCursor(doc.tz) });
                },
              },
            },
            t('calendar.today') || 'Today'
          ),
          h(
            'button',
            {
              attrs: { type: 'button', 'aria-label': 'Next' },
              on: {
                click: () => {
                  shiftCursor(1);
                },
              },
            },
            '›'
          ),
          h('span', { class: 'cal-ws-cursor' }, `${doc.cursor} · ${tzLabel(doc.tz)}`)
        ),
        h(
          'div',
          { class: 'cal-ws-io' },
          h(
            'button',
            {
              class: 'cal-ws-io__btn',
              attrs: { type: 'button', title: 'Import JSON/ICS' },
              on: {
                click: () => {
                  void (async () => {
                    try {
                      const files = await pickFile({
                        accept: '.json,.ics,text/calendar,application/json',
                      });
                      const file = files?.[0];
                      if (!file) {
                        return;
                      }
                      commit(importCalendarText(await file.text()));
                    } catch {
                      /* cancelled */
                    }
                  })();
                },
              },
            },
            t('calendar.importCalendar') || 'Import'
          ),
          h(
            'button',
            {
              class: 'cal-ws-io__btn',
              attrs: { type: 'button', title: 'Export JSON' },
              on: {
                click: () => {
                  downloadBlob(serializePayload(doc), 'calendar.json', 'application/json');
                },
              },
            },
            'JSON'
          ),
          h(
            'button',
            {
              class: 'cal-ws-io__btn',
              attrs: { type: 'button', title: 'Export ICS' },
              on: {
                click: () => {
                  downloadBlob(serializeIcs(doc), 'calendar.ics', 'text/calendar');
                },
              },
            },
            'ICS'
          )
        )
      )
    );
  };

  const refreshAll = (): void => {
    const header = host.querySelector('.cal-ws-header-host');
    if (header instanceof HTMLElement) {
      refreshHeader(header);
    }
    syncMobilePanel();
    refreshPalette();
    refreshCanvas();
    refreshInspector();
  };

  const handleAddEvent = (): void => {
    const calId = selectedLayerId ?? doc.calendars[0]?.id;
    if (!calId) {
      return;
    }
    const ev = emptyEvent(calId, {
      start: `${doc.cursor}T09:00`,
      end: `${doc.cursor}T10:00`,
    });
    selectedEventId = ev.id;
    selectedLayerId = null;
    mobilePanel = 'inspector';
    syncMobilePanel();
    commit(addEvent(doc, ev));
  };

  const root: ViewSpec = h(
    'div',
    {
      class: `ocm-studio cal-ws${opts.mode === 'atom' ? ' cal-ws--atom' : ''}`,
    },
    h('div', { class: 'cal-ws-header-host' }),
    h('div', { class: 'ocm-studio__tabs-host cal-ws-tabs-host' }),
    h(
      'div',
      {
        class: 'ocm-studio__body cal-ws-body',
        style: {
          '--ocm-studio-cols': 'minmax(11rem,13rem) minmax(0,1fr) minmax(15rem,18rem)',
        },
        attrs: { 'data-panel': mobilePanel },
      },
      h('div', {
        class: 'cal-ws-palette-host',
        attrs: { 'data-ocm-studio-pane': 'palette' },
      }),
      h('div', {
        class: 'cal-ws-canvas-host',
        attrs: { 'data-ocm-studio-pane': 'canvas' },
      }),
      h('div', {
        class: 'cal-ws-inspector-host',
        attrs: { 'data-ocm-studio-pane': 'inspector' },
      })
    )
  );

  rootMount = mount(host, root);
  tabsHost = host.querySelector('.ocm-studio__tabs-host');
  paletteHost = host.querySelector('.cal-ws-palette-host');
  canvasHost = host.querySelector('.cal-ws-canvas-host');
  inspectorHost = host.querySelector('.cal-ws-inspector-host');
  bodyEl = host.querySelector('.ocm-studio__body');
  refreshAll();

  return {
    destroy: () => {
      canvasMount?.destroy();
      inspectorMount?.destroy();
      paletteMount?.destroy();
      tabsMount?.destroy();
      rootMount?.destroy();
    },
    update: (state) => {
      if (suppressDocSync) {
        return;
      }
      try {
        doc = payloadFromDoc(state.doc);
        refreshAll();
      } catch {
        /* ignore non-calendar docs */
      }
    },
    getPayload: () => doc,
    setPayload: (next) => {
      doc = next;
      refreshAll();
      emitChange();
    },
    addEvent: handleAddEvent,
    clearEvents: () => {
      selectedEventId = null;
      commit({ ...doc, events: [] });
    },
    setView: (view) => {
      commit({ ...doc, view });
    },
    importText: (text) => {
      commit(importCalendarText(text));
    },
    exportJson: () => serializePayload(doc),
    exportIcs: () => serializeIcs(doc),
  };
}
