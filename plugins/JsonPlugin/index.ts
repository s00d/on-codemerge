import type { Command } from '@codemerge/kernel';
import { applyToolbarConfig, definePlugin, foreign, attrString } from '@codemerge/sdk';
import type { PluginDefinition, PluginToolbarOpts, WidgetContext, ViewSpec } from '@codemerge/sdk';
import { jsonCommandMap } from './commands/jsonCommands';
import { setupAtomChrome } from './chrome/atom';
import type { AtomChromeHandle } from './chrome/atom';
import { bindJsonViewModeActive, defaultJsonToolbar } from './chrome/defaultToolbar';
import { setFormatIndent } from './chrome/format';
import { setupTreeContextMenu } from './chrome/tree';
import type { JsonToolbarOptions } from './chrome/types';
import { bindShortcutsPopup } from '@ocm/shortcuts-plugin';
import { isJsonEditorDoc } from './io/adapters';
import { mountJsonWorkspace } from './surface/workspaceView';
import type { JsonWorkspaceHandle } from './surface/workspaceView';
import { mountJsonEmbed } from './widgets/mountJsonEmbed';
import { renderJsonEmbedPublish } from './publish/preview';

export {
  valueToDoc,
  docToValue,
  toEditorDoc,
  emptyEditorDoc,
  isJsonEditorDoc,
  indentFromDoc,
  resolveJsonRoot,
  encodeJsonValue,
} from './io/adapters';
export { parseText, serializeText, serializeDoc } from './io/text';
export type { ParseTextResult } from './io/text';
export {
  setValue,
  insertProperty,
  insertItem,
  deleteNode,
  renameKey,
  changeType,
  moveItem,
  duplicateNode,
  pathToDot,
  pathToJsonPointer,
  valueAtDocPath,
  valueFromNode,
  jsonCommandMap,
  type JsonLeafType,
} from './commands/jsonCommands';
export { defaultJsonToolbar } from './chrome/defaultToolbar';
export type {
  JsonToolbarActionApi,
  JsonToolbarItem,
  JsonToolbarMenu,
  JsonToolbarOptions,
} from './chrome/types';
export {
  DRIVERS as JSON_VALUE_DRIVERS,
  getDriver as getJsonValueDriver,
  allJsonLeafTypes,
  typeLabel as jsonTypeLabel,
} from './drivers/registry';
export type { JsonValueDriver } from './drivers/types';

const JSON_NODES = [
  { name: 'json', group: 'block' as const, attrs: { indent: 2 } },
  { name: 'jsonObject', group: 'block' as const },
  { name: 'jsonProperty', group: 'block' as const, attrs: { key: '' } },
  { name: 'jsonArray', group: 'block' as const },
  { name: 'jsonString', group: 'block' as const },
  { name: 'jsonNumber', group: 'block' as const, attrs: { value: 0 } },
  { name: 'jsonBoolean', group: 'block' as const, attrs: { value: false } },
  { name: 'jsonNull', group: 'block' as const },
  /** CE embed atom — plain JSON text in attrs (workspace Tree uses json* tree above). */
  {
    name: 'json_embed',
    group: 'atom' as const,
    atom: true as const,
    attrs: { text: '{\n  "key": "value"\n}' },
  },
];

export type JsonPluginFeatures = {
  /** Atom Insert-embed chrome (default true). Workspace bar buttons come from `toolbar`. */
  toolbar?: boolean;
  /** Raw textarea in workspace surface (default true; workspace only). */
  rawPane?: boolean;
  /** Tree context menu (default true; workspace only). */
  treeChrome?: boolean;
  /** Shortcuts popup + Mod-/ hotkey (default true; workspace only). */
  shortcuts?: boolean;
};

export type JsonPluginOptions = PluginToolbarOpts & {
  /**
   * `workspace` — mount Tree(+Raw) into `contentTarget` (slim JSON app).
   * `atom` — schema/commands + Insert JSON embed atom (WYSIWYG; default).
   */
  surface?: 'workspace' | 'atom';
  features?: JsonPluginFeatures;
  /**
   * Declarative workspace toolbar (menus + items). Sole source of bar buttons.
   * Omit to use `defaultJsonToolbar`. Pass `{ menus: [], items: [] }` for an empty bar.
   * Atom surface ignores this; use `menu` / `group` / `order` for Insert placement.
   */
  toolbar?: JsonToolbarOptions;
};

/**
 * Unified JSON plugin — schema + commands always; Tree/Raw surface and chrome via options.
 */
export function JsonPlugin(options: JsonPluginOptions = {}): PluginDefinition {
  const surface = options.surface ?? 'atom';
  const workspace = surface === 'workspace';
  const feat = (key: keyof JsonPluginFeatures, defaultOn: boolean): boolean => {
    const v = options.features?.[key];
    return v === undefined ? defaultOn : v;
  };
  const features: Required<JsonPluginFeatures> = {
    toolbar: feat('toolbar', true),
    rawPane: feat('rawPane', workspace),
    treeChrome: feat('treeChrome', workspace),
    shortcuts: feat('shortcuts', workspace),
  };
  // Workspace-owned capabilities never run on atom even if a caller forces features on.
  const formatHotkeys = workspace;
  const shortcutsHotkeys = workspace && features.shortcuts;
  const treeContextMenu = workspace && features.treeChrome;
  const toolbarConfig: JsonToolbarOptions | undefined = workspace
    ? (options.toolbar ??
      defaultJsonToolbar({
        viewMode: features.rawPane,
        shortcuts: features.shortcuts,
      }))
    : undefined;

  const openShortcuts: { current: (() => void) | null } = { current: null };
  const atomChrome: { current: AtomChromeHandle | null } = { current: null };
  const workspaceRef: { current: JsonWorkspaceHandle | null } = { current: null };
  const commands: Record<string, Command> = {
    ...jsonCommandMap(),
    'json.formatPretty': setFormatIndent(2),
    'json.formatCompact': setFormatIndent(0),
    'json.showShortcuts': () => {
      openShortcuts.current?.();
      return null;
    },
    insertJsonEmbed: () => {
      atomChrome.current?.openInsert();
      return null;
    },
  };

  const hotkeys = [
    ...(formatHotkeys
      ? [
          {
            keys: 'Mod-Shift-f',
            command: 'json.formatPretty',
            description: 'Format JSON (pretty)',
          },
          {
            keys: 'Mod-Shift-c',
            command: 'json.formatCompact',
            description: 'Format JSON (compact)',
          },
        ]
      : []),
    ...(shortcutsHotkeys
      ? [
          {
            keys: 'Mod-/',
            command: 'json.showShortcuts',
            description: 'Show keyboard shortcuts',
          },
        ]
      : []),
    ...(!workspace && features.toolbar
      ? [
          {
            keys: 'Mod-Alt-j',
            command: 'insertJsonEmbed',
            description: 'Insert JSON embed',
          },
        ]
      : []),
  ];

  return definePlugin({
    name: 'json',
    nodes: JSON_NODES,
    commands,
    hotkeys,
    setup(ctx) {
      if (workspace) {
        const doc = ctx.editor.getState().doc;
        if (!isJsonEditorDoc(doc)) {
          throw new TypeError(
            'JsonPlugin({ surface: "workspace" }) requires a JSON SoT (doc→json); seed emptyEditorDoc()'
          );
        }
        const fromApi = ctx.editor.contentElement();
        const contentEl =
          fromApi instanceof HTMLElement && fromApi.getAttribute('data-ocm-shell') === 'true'
            ? fromApi
            : ctx.editor.host.querySelector('[data-ocm-shell="true"]');
        if (!(contentEl instanceof HTMLElement)) {
          throw new TypeError(
            'JsonPlugin({ surface: "workspace" }) requires createShellView contentTarget (data-ocm-shell)'
          );
        }
        const surfaceHandle = mountJsonWorkspace(ctx.editor, contentEl, {
          rawPane: features.rawPane,
          onModeChange: () => {
            ctx.editor.toolbar.refresh();
          },
        });
        workspaceRef.current = surfaceHandle;
        ctx.own({
          destroy: () => {
            workspaceRef.current = null;
            surfaceHandle.destroy();
          },
        });
        ctx.on('docChanged', () => {
          surfaceHandle.update(ctx.editor.getState());
        });
        ctx.on('selectionChanged', () => {
          surfaceHandle.update(ctx.editor.getState());
        });
        if (features.shortcuts) {
          bindShortcutsPopup(ctx.editor, ctx.scope, openShortcuts);
        }
        if (treeContextMenu) {
          setupTreeContextMenu(ctx);
        }
        if (toolbarConfig) {
          const bound = bindJsonViewModeActive(toolbarConfig, () => workspaceRef.current);
          applyToolbarConfig(ctx, bound, () => ({
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
          json_embed: {
            render(attrs, wctx: WidgetContext): ViewSpec {
              const text = attrString(attrs.text, '{\n  "key": "value"\n}\n');
              return foreign((host, scope) => {
                mountJsonEmbed(
                  host,
                  {
                    text,
                    path: wctx.path,
                    editor: wctx.editor,
                    onCommit: (next) => {
                      wctx.updateAttrs({ text: next });
                    },
                    labels: {
                      title: wctx.editor.t('json.insert'),
                      tree: 'Tree',
                      raw: 'Raw',
                    },
                  },
                  scope
                );
              });
            },
          },
        },
    publish: {
      node: 'json_embed',
      render: (attrs) => renderJsonEmbedPublish(attrs),
    },
  });
}

/** Default slim-app plugin set: workspace JsonPlugin. */
export function createDefaultPlugins(
  opts: { toolbar?: JsonToolbarOptions } = {}
): PluginDefinition[] {
  return [
    JsonPlugin({
      surface: 'workspace',
      toolbar: opts.toolbar ?? defaultJsonToolbar({ viewMode: true, shortcuts: true }),
    }),
  ];
}
