import './style.scss';
import { calendarIcon } from '@ocm/wysiwyg/icons';
import {
  definePlugin,
  insertAtomAfter,
  attrString,
  h,
  pluginToolbarPlacement,
} from '@codemerge/sdk';
import { foreign } from '@codemerge/sdk';
import type { WidgetContext, ViewSpec, PluginToolbarOpts } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';
import { CalendarMenu } from './components/CalendarMenu';
import { CalendarManager } from './services/CalendarManager';
import { CalendarContextMenu } from './components/CalendarContextMenu';
import type { Calendar, CalendarEvent } from './types';
import { downloadJson, pickJsonFile, mountCalendarView } from './widgets/domOps';
import { asAttr } from '@ocm/wysiwyg/utils/asAttr';
import { pathFromEl, queryAtomHosts } from '@ocm/wysiwyg/utils/atomPath';
import { readJsonAttr } from '@ocm/wysiwyg/utils/attrJson';
import { isCalendar, parseCalendarImportPayload } from './utils/storageGuards';

type CalendarPayload = { calendar: Calendar; events: CalendarEvent[] };

/** SoT payload — typed object (legacy JSON string via readJsonAttr). */
function calendarPayload(cal: Calendar, events: CalendarEvent[]): CalendarPayload {
  return { calendar: cal, events };
}

function parsePayload(raw: unknown): CalendarPayload | null {
  return parseCalendarImportPayload(readJsonAttr(raw, null));
}

export function CalendarPlugin(opts?: PluginToolbarOpts) {
  const manager = new CalendarManager();
  let editor!: EditorAPI;
  let menu!: CalendarMenu;
  let contextMenu!: CalendarContextMenu;
  let openCalendarMenu: (() => void) | null = null;

  const refreshWidgets = () => {
    // Remount via model attrs — do not invent DOM with replaceWithHtml.
    persistOpenCalendars();
  };

  const handleContextAction = (action: string, target: Calendar | CalendarEvent) => {
    if ('events' in target) {
      switch (action) {
        case 'add-event': {
          menu.showCreateEvent(target.id, refreshWidgets);
          break;
        }
        case 'edit-calendar': {
          menu.showEditCalendarForm(target);
          break;
        }
        case 'copy-calendar': {
          try {
            manager.copyCalendar(target.id);
            editor.notify(editor.t('calendar.calendarCopiedSuccessfully') || 'Calendar copied');
            refreshWidgets();
          } catch {
            editor.notify(editor.t('calendar.failedToCopyCalendar') || 'Copy failed');
          }
          break;
        }
        case 'export-calendar': {
          showExport(target);
          break;
        }
        case 'import-calendar': {
          showImport();
          break;
        }
        case 'delete-calendar': {
          manager.deleteCalendar(target.id);
          refreshWidgets();
          break;
        }
      }
    } else {
      switch (action) {
        case 'edit-event': {
          menu.showEditEvent(target, refreshWidgets);
          break;
        }
        case 'copy-event': {
          try {
            manager.copyEvent(target.id);
            editor.notify(editor.t('calendar.eventCopiedSuccessfully') || 'Event copied');
            refreshWidgets();
          } catch {
            editor.notify(editor.t('calendar.failedToCopyEvent') || 'Copy failed');
          }
          break;
        }
        case 'delete-event': {
          manager.deleteEvent(target.id);
          refreshWidgets();
          break;
        }
      }
    }
  };

  const persistOpenCalendars = () => {
    for (const el of queryAtomHosts(editor.host, 'calendar')) {
      const path = pathFromEl(el);
      const calId =
        el.querySelector<HTMLElement>('.calendar-widget')?.dataset.calendarId ??
        el.dataset.calendarId;
      if (!path || !calId) {
        continue;
      }
      const cal = manager.getCalendar(calId);
      if (!cal) {
        continue;
      }
      editor.run(() => [
        {
          type: 'set_attrs',
          path,
          attrs: {
            payload: calendarPayload(cal, manager.getEvents(cal.id)),
            title: cal.title,
          },
        },
      ]);
    }
  };

  const showExport = (calendar: Calendar) => {
    try {
      const data = JSON.stringify({ calendar, events: manager.getEvents(calendar.id) }, null, 2);
      downloadJson(`calendar-${calendar.id}.json`, data);
    } catch {
      editor.notify(editor.t('export.exportFailed'));
    }
  };

  const showImport = () => {
    pickJsonFile((text) => {
      try {
        const imported: unknown = JSON.parse(text);
        const wrapped = parseCalendarImportPayload(imported);
        if (wrapped) {
          manager.importCalendar(wrapped);
        } else if (isCalendar(imported)) {
          manager.importCalendar({ calendar: imported, events: imported.events ?? [] });
        } else {
          throw new Error('Invalid calendar');
        }
        editor.notify(editor.t('calendar.calendarImportedSuccessfully') || 'Imported');
        menu.show((cal) => {
          insertCalendar(cal);
        });
      } catch {
        editor.notify(editor.t('common.importFailed'));
      }
    });
  };

  const insertCalendar = (calendarData: Calendar) => {
    const events = manager.getEvents(calendarData.id);
    editor.run(
      insertAtomAfter('calendar', {
        title: calendarData.title,
        calendarId: calendarData.id,
        payload: calendarPayload(calendarData, events),
        align: '',
      })
    );
  };

  return definePlugin({
    commands: {
      insertCalendar: () => {
        openCalendarMenu?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-l', command: 'insertCalendar', description: 'Insert calendar' }],
    name: 'calendar',
    nodes: [
      {
        name: 'calendar',
        group: 'atom',
        atom: true,
        attrs: { title: 'Calendar', calendarId: '', payload: null, align: '' },
      },
    ],
    setup(ctx) {
      editor = ctx.editor;
      menu = new CalendarMenu(manager, editor, showImport, ctx.scope);
      contextMenu = ctx.own(new CalendarContextMenu(editor, handleContextAction));
      openCalendarMenu = () => {
        menu.show((cal) => {
          insertCalendar(cal);
        });
      };

      ctx.toolbar.add({
        id: 'calendar',
        icon: calendarIcon,
        title: () => editor.t('calendar.title'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 51 }, opts),
        onClick: () => openCalendarMenu?.(),
      });

      ctx.onDom('host', 'click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const eventElement = target.closest<HTMLElement>('.calendar-event');
        if (!eventElement) {
          return;
        }
        e.preventDefault();
        const eventId = eventElement.dataset.eventId;
        if (!eventId) {
          return;
        }
        const ev = manager.getEvent(eventId);
        if (ev) {
          menu.showEditEvent(ev, () => {
            refreshWidgets();
            persistOpenCalendars();
          });
        }
      });

      ctx.onDom('host', 'contextmenu', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const calendarElement = target.closest('.calendar-widget');
        const eventElement = target.closest('.calendar-event');
        if (calendarElement instanceof HTMLElement) {
          e.preventDefault();
          const calendarId = calendarElement.dataset.calendarId;
          const calendar = calendarId ? manager.getCalendar(calendarId) : null;
          if (calendar) {
            contextMenu.show(calendar, e.clientX, e.clientY);
          }
        } else if (eventElement instanceof HTMLElement) {
          e.preventDefault();
          const eventId = eventElement.dataset.eventId;
          const ev = eventId ? manager.getEvent(eventId) : null;
          if (ev) {
            contextMenu.show(ev, e.clientX, e.clientY);
          }
        }
      });
    },
    widgets: {
      calendar: {
        render(attrs, _wctx: WidgetContext): ViewSpec {
          return foreign((host, scope) => {
            const payload = parsePayload(attrs.payload);
            let cal = payload?.calendar ?? null;
            if (!cal && asAttr(attrs.calendarId)) {
              cal = manager.getCalendar(asAttr(attrs.calendarId));
            }
            cal ??= manager.createCalendar({
              title: attrString(attrs.title, 'Calendar'),
              description: '',
            });
            if (!manager.getCalendar(cal.id)) {
              manager.importCalendar({
                calendar: cal,
                events: payload?.events ?? cal.events ?? [],
              });
            }
            const align = attrString(attrs.align, '');
            const spec = manager.calendarView(cal, {
              emptyLabel: editor.t('calendar.noEvents'),
            });
            mountCalendarView(host, spec, scope, align);
          });
        },
      },
    },
    publish: {
      node: 'calendar',
      runtime: 'calendar-reminders',
      render: (attrs) => {
        const payload = parsePayload(attrs.payload);
        let cal = payload?.calendar ?? null;
        if (!cal && asAttr(attrs.calendarId)) {
          cal = manager.getCalendar(asAttr(attrs.calendarId));
        }
        if (!cal) {
          return h('div', { attrs: { 'data-node': 'calendar' } });
        }
        if (!manager.getCalendar(cal.id)) {
          manager.importCalendar({
            calendar: cal,
            events: payload?.events ?? cal.events ?? [],
          });
        }
        return manager.calendarView(cal, {
          publish: true,
          emptyLabel: editor.t('calendar.noEvents'),
          align: attrString(attrs.align, ''),
        });
      },
    },
  });
}
