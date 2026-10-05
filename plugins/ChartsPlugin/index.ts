import { applyToolbarConfig, definePlugin, foreign } from '@codemerge/sdk';
import type { PluginDefinition, PluginToolbarOpts, WidgetContext, ViewSpec } from '@codemerge/sdk';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import type { Command } from '@codemerge/kernel';

import { setupAtomChrome } from './chrome/atom';
import type { AtomChromeHandle } from './chrome/atom';
import { defaultChartToolbar } from './chrome/defaultToolbar';
import type { ChartToolbarOptions } from './chrome/types';
import { isChartEditorDoc } from './io/adapters';
import { mountChartWorkspace } from './surface/workspaceView';
import type { ChartWorkspaceHandle } from './surface/workspaceView';
import { renderChartPublish } from './publish/preview';
import { mountChartWidget } from './widgets/mountChartWidget';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

export {
  emptyChartAttrs,
  emptyEditorDoc,
  isChartEditorDoc,
  resolveChartNode,
  attrsFromDoc,
  docFromAttrs,
  toEditorDoc,
  normalizeChartAttrs,
  isChartAttrs,
  DEFAULT_CHART_DATA,
} from './io/adapters';
export type { ChartAttrs } from './io/adapters';
export { parseText, serializeText, serializeDoc, serializeAttrs, MAX_CHART_BYTES } from './io/text';
export type { ParseTextResult } from './io/text';
export type {
  ChartToolbarActionApi,
  ChartToolbarItem,
  ChartToolbarMenu,
  ChartToolbarOptions,
} from './chrome/types';
export { defaultChartToolbar } from './chrome/defaultToolbar';
export { mountChartWorkspace } from './surface/workspaceView';
export type { ChartWorkspaceHandle } from './surface/workspaceView';

export type ChartsPluginFeatures = {
  toolbar?: boolean;
};

export type ChartsPluginOptions = PluginToolbarOpts & {
  surface?: 'workspace' | 'atom';
  features?: ChartsPluginFeatures;
  toolbar?: ChartToolbarOptions;
};

export function ChartsPlugin(options: ChartsPluginOptions = {}): PluginDefinition {
  const surface = options.surface ?? 'atom';
  const workspace = surface === 'workspace';
  const feat = (key: keyof ChartsPluginFeatures, defaultOn: boolean): boolean => {
    const v = options.features?.[key];
    return v === undefined ? defaultOn : v;
  };
  const features: Required<ChartsPluginFeatures> = {
    toolbar: feat('toolbar', true),
  };
  const atomChrome: { current: AtomChromeHandle | null } = { current: null };
  const workspaceRef: { current: ChartWorkspaceHandle | null } = { current: null };

  const commands: Record<string, Command> = {
    insertChart: () => {
      atomChrome.current?.openStudio();
      return null;
    },
  };

  const hotkeys = !workspace
    ? [{ keys: 'Mod-Alt-g', command: 'insertChart', description: 'Insert chart' }]
    : [];

  return definePlugin({
    name: 'charts',
    nodes: [
      {
        name: 'chart',
        group: 'atom',
        atom: true,
        attrs: {
          chartType: 'bar',
          data: [],
          title: 'Chart',
          width: 800,
          height: 400,
          align: '',
          showLegend: true,
          showGrid: true,
          mode: 'default',
          orientation: 'vertical',
          xAxisLabel: '',
          yAxisLabel: '',
        },
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
        if (!isChartEditorDoc(doc)) {
          throw new TypeError(
            'ChartsPlugin({ surface: "workspace" }) requires chart SoT (doc→chart); seed emptyEditorDoc()'
          );
        }
        const fromApi = ctx.editor.contentElement();
        const contentEl =
          fromApi instanceof HTMLElement && fromApi.getAttribute('data-ocm-shell') === 'true'
            ? fromApi
            : ctx.editor.host.querySelector('[data-ocm-shell="true"]');
        if (!(contentEl instanceof HTMLElement)) {
          throw new TypeError(
            'ChartsPlugin({ surface: "workspace" }) requires createShellView contentTarget (data-ocm-shell)'
          );
        }

        let writing = false;
        const handle = mountChartWorkspace(ctx.editor, contentEl, {
          mode: 'workspace',
          scope: ctx.scope,
          onChange: (attrs) => {
            if (writing) {
              return;
            }
            writing = true;
            ctx.editor.run(() => [
              {
                type: 'set_attrs',
                path: [0],
                attrs: { ...attrs },
              },
            ]);
            writing = false;
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
        const toolbarConfig =
          options.toolbar ??
          (features.toolbar ? defaultChartToolbar({ t: (k) => ctx.editor.t(k) }) : undefined);
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
          chart: {
            render(attrs, wctx: WidgetContext): ViewSpec {
              return foreign((host, scope) => {
                mountChartWidget(host, attrs, () => wctx.editor, scope);
              });
            },
          },
        },
    publish: {
      node: 'chart',
      render: (attrs) => renderChartPublish(attrs),
    },
  });
}

export function createDefaultPlugins(
  opts: { toolbar?: ChartToolbarOptions } = {}
): PluginDefinition[] {
  return [
    ChartsPlugin({
      surface: 'workspace',
      // Omit toolbar → setup builds defaultChartToolbar({ t: editor.t }).
      ...(opts.toolbar ? { toolbar: opts.toolbar } : {}),
    }),
  ];
}

export default ChartsPlugin;
