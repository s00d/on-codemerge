import './style.scss';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import type { Command } from '@codemerge/kernel';
import { applyToolbarConfig, definePlugin, foreign } from '@codemerge/sdk';
import type { PluginDefinition, PluginToolbarOpts, WidgetContext, ViewSpec } from '@codemerge/sdk';
import { HistoryChromePlugin } from '../HistoryPlugin';
import { setupAtomChrome } from './chrome/atom';
import type { AtomChromeHandle } from './chrome/atom';
import type { ChartToolbarOptions } from './chrome/types';
import { isChartEditorDoc } from './io';
import { mountChartWorkspace } from './surface/workspaceView';
import type { ChartWorkspaceHandle } from './surface/workspaceView';
import { renderChartPublish } from './publish/preview';
import { mountChartWidget } from './widgets/mountChartWidget';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

function hasToolbarItems(toolbar: ChartToolbarOptions): boolean {
  return (toolbar.items?.length ?? 0) > 0 || (toolbar.menus?.length ?? 0) > 0;
}

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
  ParseError,
  parseText,
  serializeText,
  serializeDoc,
  serializeAttrs,
  MAX_CHART_BYTES,
  type ChartAttrs,
  type ParseTextResult,
} from './io';
export { defaultChartToolbar } from './chrome/defaultToolbar';
export type {
  ChartToolbarActionApi,
  ChartToolbarItem,
  ChartToolbarMenu,
  ChartToolbarOptions,
} from './chrome/types';
export { HistoryChromePlugin } from '../HistoryPlugin';
export { mountChartWorkspace } from './surface/workspaceView';
export type { ChartWorkspaceHandle } from './surface/workspaceView';

export type ChartsPluginFeatures = {
  toolbar?: boolean;
  historyChrome?: boolean;
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
    historyChrome: feat('historyChrome', workspace),
  };
  const toolbarConfig: ChartToolbarOptions | undefined =
    workspace && options.toolbar && hasToolbarItems(options.toolbar) ? options.toolbar : undefined;

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
  opts: {
    toolbar?: ChartToolbarOptions;
    features?: ChartsPluginFeatures;
  } = {}
): PluginDefinition[] {
  const features: Required<ChartsPluginFeatures> = {
    toolbar: true,
    historyChrome: true,
    ...opts.features,
  };
  return [
    ...(features.historyChrome ? [HistoryChromePlugin()] : []),
    ChartsPlugin({
      surface: 'workspace',
      ...(opts.toolbar && hasToolbarItems(opts.toolbar) ? { toolbar: opts.toolbar } : {}),
      features,
    }),
  ];
}

export default ChartsPlugin;
