import {
  applyToolbarConfig,
  definePlugin,
  foreign,
  h,
  OCM_CONFIG_ATTR,
  OCM_RUNTIME_ATTR,
  readJsonAttr,
} from '@codemerge/sdk';
import type { PluginDefinition, PluginToolbarOpts, WidgetContext } from '@codemerge/sdk';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import type { Command } from '@codemerge/kernel';

import { setupAtomChrome } from './chrome/atom';
import type { AtomChromeHandle } from './chrome/atom';
import type { CalendarToolbarOptions } from './chrome/types';
import { coerceCalendarDoc } from './drivers/defaults';
import { isCalendarDoc } from './types';
import { isCalendarEditorDoc } from './io/adapters';
import { mountCalendarWorkspace } from './surface/workspaceView';
import type { CalendarWorkspaceHandle } from './surface/workspaceView';
import { mountCalendarWidget } from './widgets/mountCalendarWidget';
import { renderView } from './drivers/views';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

export {
  emptyEditorDoc,
  isCalendarEditorDoc,
  resolveCalendarNode,
  payloadFromDoc,
  docFromPayload,
  toEditorDoc,
} from './io/adapters';
export {
  parseText,
  serializeText,
  serializeDoc,
  serializePayload,
  MAX_CALENDAR_BYTES,
} from './io/text';
export type { ParseTextResult } from './io/text';
export { parseIcs, serializeIcs, importCalendarText } from './io/ics';
export type {
  CalendarToolbarActionApi,
  CalendarToolbarItem,
  CalendarToolbarMenu,
  CalendarToolbarOptions,
} from './chrome/types';
export type {
  CalendarDoc,
  CalendarEvent,
  CalendarLayer,
  CalendarView,
  CalendarRRule,
  Occurrence,
} from './types';
export { isCalendarDoc, isCalendarEvent, isCalendarView } from './types';
export {
  emptyCalendarDoc,
  coerceCalendarDoc,
  addEvent,
  patchEvent,
  removeEvent,
} from './drivers/defaults';
export { occurrences } from './drivers/occurrences';
export { renderView } from './drivers/views';
export { eventInspector } from './drivers/eventInspector';
export { mountCalendarWorkspace } from './surface/workspaceView';
export type { CalendarWorkspaceHandle } from './surface/workspaceView';

export type CalendarPluginFeatures = {
  toolbar?: boolean;
};

function hasToolbarItems(toolbar: CalendarToolbarOptions): boolean {
  return (toolbar.items?.length ?? 0) > 0 || (toolbar.menus?.length ?? 0) > 0;
}

export type CalendarPluginOptions = PluginToolbarOpts & {
  surface?: 'workspace' | 'atom';
  features?: CalendarPluginFeatures;
  toolbar?: CalendarToolbarOptions;
};

function remindersConfig(payload: ReturnType<typeof coerceCalendarDoc>): {
  reminders: Array<{ id: string; triggerTime: number; message: string; title: string }>;
} | null {
  const reminders = payload.events
    .filter((e) => typeof e.reminder === 'number' && e.reminder > 0)
    .map((e) => {
      const start = e.allDay
        ? Date.parse(`${e.start.slice(0, 10)}T09:00`)
        : Date.parse(e.start.length === 16 ? `${e.start}:00` : e.start);
      return {
        id: e.id,
        triggerTime: start - (e.reminder ?? 0) * 60_000,
        message: e.title,
        title: payload.title,
      };
    })
    .filter((r) => Number.isFinite(r.triggerTime));
  if (reminders.length === 0) {
    return null;
  }
  return { reminders };
}

export function CalendarPlugin(options: CalendarPluginOptions = {}): PluginDefinition {
  const surface = options.surface ?? 'atom';
  const workspace = surface === 'workspace';
  const feat = (key: keyof CalendarPluginFeatures, defaultOn: boolean): boolean => {
    const v = options.features?.[key];
    return v === undefined ? defaultOn : v;
  };
  const features: Required<CalendarPluginFeatures> = {
    toolbar: feat('toolbar', true),
  };
  const toolbarConfig: CalendarToolbarOptions | undefined =
    workspace && options.toolbar && hasToolbarItems(options.toolbar) ? options.toolbar : undefined;

  const atomChrome: { current: AtomChromeHandle | null } = { current: null };
  const workspaceRef: { current: CalendarWorkspaceHandle | null } = { current: null };

  const commands: Record<string, Command> = {
    insertCalendar: () => {
      atomChrome.current?.openStudio();
      return null;
    },
    'calendar.addEvent': () => {
      workspaceRef.current?.addEvent();
      return null;
    },
    'calendar.clearEvents': () => {
      workspaceRef.current?.clearEvents();
      return null;
    },
  };

  const hotkeys = !workspace
    ? [{ keys: 'Mod-Alt-l', command: 'insertCalendar', description: 'Insert calendar' }]
    : [];

  return definePlugin({
    name: 'calendar',
    nodes: [
      {
        name: 'calendar',
        group: 'atom',
        atom: true,
        attrs: { title: 'Calendar', payload: {}, align: '' },
      },
    ],
    commands,
    hotkeys,
    setup(ctx) {
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      if (workspace) {
        const doc = ctx.editor.getState().doc;
        if (!isCalendarEditorDoc(doc)) {
          throw new TypeError(
            'CalendarPlugin({ surface: "workspace" }) requires calendar SoT (doc→calendar); seed emptyEditorDoc()'
          );
        }
        const fromApi = ctx.editor.contentElement();
        const contentEl =
          fromApi instanceof HTMLElement && fromApi.getAttribute('data-ocm-shell') === 'true'
            ? fromApi
            : ctx.editor.host.querySelector('[data-ocm-shell="true"]');
        if (!(contentEl instanceof HTMLElement)) {
          throw new TypeError(
            'CalendarPlugin({ surface: "workspace" }) requires createShellView contentTarget (data-ocm-shell)'
          );
        }

        let writing = false;
        const handle = mountCalendarWorkspace(ctx.editor, contentEl, {
          mode: 'workspace',
          scope: ctx.scope,
          onChange: (payload) => {
            if (writing) {
              return;
            }
            writing = true;
            ctx.editor.run(() => [
              {
                type: 'set_attrs',
                path: [0],
                attrs: { title: payload.title, payload },
              },
            ]);
            writing = false;
            ctx.editor.toolbar.refresh();
          },
        });
        workspaceRef.current = handle;
        ctx.own({
          destroy: () => {
            workspaceRef.current = null;
            handle.destroy();
          },
        });
        ctx.on('docChanged', () => {
          if (!writing) {
            handle.update(ctx.editor.getState());
          }
        });
        if (toolbarConfig) {
          applyToolbarConfig(ctx, toolbarConfig, () => ({
            editor: ctx.editor,
            workspace: workspaceRef.current,
          }));
        }
      } else if (features.toolbar) {
        const { menu, group, order } = options;
        atomChrome.current = setupAtomChrome(ctx, {
          ...(menu !== undefined ? { menu } : {}),
          ...(group !== undefined ? { group } : {}),
          ...(order !== undefined ? { order } : {}),
        });
      }
    },
    widgets: workspace
      ? undefined
      : {
          calendar: {
            render: (attrs, wctx: WidgetContext) =>
              foreign((el, scope) => {
                const payload = readJsonAttr(attrs.payload, null);
                mountCalendarWidget(el, {
                  payload,
                  editor: wctx.editor,
                  scope,
                  onOpenStudio: () => {
                    atomChrome.current?.openStudio(el.closest('[data-type="calendar"]'));
                  },
                });
              }),
          },
        },
    publish: {
      node: 'calendar',
      runtime: 'calendar-reminders',
      render: (attrs) => {
        const payload = isCalendarDoc(attrs.payload)
          ? attrs.payload
          : coerceCalendarDoc(attrs.payload);
        const stub = { t: (k: string) => k };
        const view = renderView(payload, {
          i18n: stub,
          selectedEventId: null,
          onSelectEvent: () => {},
          onSelectDay: () => {},
          onChangeView: () => {},
        });
        const cfg = remindersConfig(payload);
        const runtimeAttrs: Record<string, string> = {
          'data-node': 'calendar',
          [OCM_RUNTIME_ATTR]: 'calendar-reminders',
        };
        if (cfg !== null) {
          runtimeAttrs[OCM_CONFIG_ATTR] = JSON.stringify(cfg);
        }
        return h('div', { class: 'ocm-calendar-publish', attrs: runtimeAttrs }, view);
      },
    },
  });
}

export function createDefaultPlugins(
  opts: { toolbar?: CalendarToolbarOptions } = {}
): PluginDefinition[] {
  return [
    CalendarPlugin({
      surface: 'workspace',
      ...(opts.toolbar && hasToolbarItems(opts.toolbar) ? { toolbar: opts.toolbar } : {}),
    }),
  ];
}

export default CalendarPlugin;
