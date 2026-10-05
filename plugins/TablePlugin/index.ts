import {
  applyToolbarConfig,
  definePlugin,
  core,
  pluginToolbarPlacement,
  insertAtomAfter,
  foreign,
} from '@codemerge/sdk';
import type {
  EditorAPI,
  PluginDefinition,
  PluginToolbarOpts,
  WidgetContext,
  ViewSpec,
} from '@codemerge/sdk';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import type { Command } from '@codemerge/kernel';
import { tableIcon, lazyTableIcon } from '@codemerge/sdk/icons';

import { TablePopup } from './components/TablePopup';
import type { LazyTableConfig } from './io/fetchMatrix';
import { fetchLazyMatrix } from './io/fetchMatrix';
import { bindTableViewModeActive, defaultTableToolbar } from './chrome/defaultToolbar';
import { openMatrixImportPopup } from './chrome/importPopup';
import type { TableToolbarOptions } from './chrome/types';
import {
  isTableEditorDoc,
  attrsFromGrid,
  gridFromMatrix,
  normalizeTableGrid,
  sizedEmptyGrid,
} from './io/adapters';
import type { TableGridSource } from './io/adapters';
import { mountTableWorkspace } from './surface/workspaceView';
import type { TableWorkspaceHandle } from './surface/workspaceView';
import { mountTableGridWidget, TABLE_ATOM_DEFAULT_H } from './widgets/mountTableGridWidget';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

const lazyKey = (id: string | undefined, url: string, index: number) => `${id ?? index}:${url}`;

function findTableGridPath(doc: { content?: { type: string }[] }, path: number[]): number[] | null {
  const i = path[0];
  if (i !== undefined && doc.content?.[i]?.type === 'tableGrid') {
    return [i];
  }
  const found = (doc.content ?? []).findIndex((n) => n.type === 'tableGrid');
  return found >= 0 ? [found] : null;
}

export {
  emptyEditorDoc,
  emptyTableGrid,
  sizedEmptyGrid,
  isTableEditorDoc,
  gridFromDoc,
  gridFromMatrix,
  docFromGrid,
  toEditorDoc,
  normalizeTableGrid,
  exportCsv,
  gridToHtml,
  gridToMatrix,
  attrsFromGrid,
} from './io/adapters';
export type {
  TableGridDoc,
  TableColumn,
  TableRow,
  TableViewState,
  TableGridSource,
  CellValue,
  CellStyle,
} from './io/adapters';
export { parseText, serializeText, serializeDoc, MAX_TABLE_BYTES } from './io/text';
export type { ParseTextResult } from './io/text';
export { defaultTableToolbar } from './chrome/defaultToolbar';
export type {
  TableToolbarActionApi,
  TableToolbarItem,
  TableToolbarMenu,
  TableToolbarOptions,
} from './chrome/types';

export type TablePluginOptions = PluginToolbarOpts & {
  surface?: 'workspace' | 'atom';
  /** @deprecated ignored — toolbar always on when surface provides one */
  features?: { toolbar?: boolean };
  toolbar?: TableToolbarOptions;
};

/** @deprecated use TablePluginOptions — features flag removed */
export type TablePluginFeatures = { toolbar?: boolean };

const WORKSPACE_NODES = [
  {
    name: 'tableGrid',
    group: 'atom' as const,
    atom: true as const,
    attrs: { version: 2, columns: [], rows: [], view: undefined, source: undefined },
  },
];

function lazyConfigFromSource(src: TableGridSource): LazyTableConfig {
  return {
    url: src.url,
    format: src.format,
    headers: src.headers !== false,
    delimiter: src.delimiter ?? ',',
  };
}

function sourceFromLazy(config: LazyTableConfig): TableGridSource {
  return {
    url: config.url,
    format: config.format === 'csv' ? 'csv' : 'json',
    headers: config.headers,
    delimiter: config.delimiter,
  };
}

async function applyGridSource(
  editor: EditorAPI,
  path: number[],
  src: TableGridSource
): Promise<boolean> {
  const { matrix, hasHeader } = await fetchLazyMatrix(lazyConfigFromSource(src));
  const next = gridFromMatrix(matrix, hasHeader);
  next.source = src;
  return editor.run(() => [{ type: 'set_attrs', path, attrs: attrsFromGrid(next) }]);
}

export function TablePlugin(options: TablePluginOptions = {}): PluginDefinition {
  const surface = options.surface ?? 'atom';
  const workspace = surface === 'workspace';
  const toolbarConfig: TableToolbarOptions | undefined = workspace
    ? (options.toolbar ?? defaultTableToolbar())
    : undefined;

  const workspaceRef: { current: TableWorkspaceHandle | null } = { current: null };
  let openInsertLazy: (() => void) | null = null;
  let openEditLazy: (() => void) | null = null;
  let refreshLazy: (() => void) | null = null;
  let openInsertTable: (() => void) | null = null;

  const atomCommands: Record<string, Command> = {
    insertTable: () => {
      openInsertTable?.();
      return null;
    },
    insertLazyTable: () => {
      openInsertLazy?.();
      return null;
    },
    editLazyTable: () => {
      openEditLazy?.();
      return null;
    },
    fillTable: () => {
      refreshLazy?.();
      return null;
    },
  };

  const workspaceCommands: Record<string, Command> = {
    'table.addRow': () => {
      if (workspaceRef.current?.isRawDirty()) {
        return null;
      }
      workspaceRef.current?.addRow();
      return null;
    },
    'table.addColumn': () => {
      if (workspaceRef.current?.isRawDirty()) {
        return null;
      }
      workspaceRef.current?.addColumn();
      return null;
    },
    'table.importUrl': () => {
      workspaceRef.current?.openImport();
      return null;
    },
    'table.refreshSource': () => {
      workspaceRef.current?.refreshSource();
      return null;
    },
    'table.editSource': () => {
      workspaceRef.current?.editSource();
      return null;
    },
    'table.exportCsv': () => {
      workspaceRef.current?.exportCsv();
      return null;
    },
  };

  const hotkeys = workspace
    ? [
        { keys: 'Mod-Shift-u', command: 'table.importUrl', description: 'Import table from URL' },
        { keys: 'Mod-Alt-k', command: 'table.editSource', description: 'Edit table source URL' },
      ]
    : [
        { keys: 'Mod-Shift-t', command: 'insertTable', description: 'Insert table' },
        { keys: 'Mod-Shift-u', command: 'insertLazyTable', description: 'Insert lazy table' },
        { keys: 'Mod-Alt-k', command: 'editLazyTable', description: 'Edit lazy table' },
      ];

  return definePlugin({
    name: 'table',
    nodes: WORKSPACE_NODES,
    commands: workspace ? workspaceCommands : atomCommands,
    hotkeys,
    widgets: workspace
      ? undefined
      : {
          tableGrid: {
            render(attrs, wctx: WidgetContext): ViewSpec {
              return foreign((host, scope) => {
                mountTableGridWidget(
                  host,
                  {
                    grid: normalizeTableGrid(attrs),
                    path: wctx.path,
                    editor: wctx.editor,
                    width: attrs.width,
                    height: attrs.height,
                    onCommit: (grid, box) => {
                      wctx.updateAttrs({
                        ...attrsFromGrid(grid),
                        width: box.width,
                        height: box.height,
                      });
                    },
                    onResize: (box) => {
                      wctx.updateAttrs({ width: box.width, height: box.height });
                    },
                  },
                  scope
                );
              });
            },
          },
        },
    setup(ctx) {
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      if (workspace) {
        const doc = ctx.editor.getState().doc;
        if (!isTableEditorDoc(doc)) {
          throw new TypeError(
            'TablePlugin({ surface: "workspace" }) requires table grid SoT (doc→tableGrid); seed emptyEditorDoc()'
          );
        }
        const fromApi = ctx.editor.contentElement();
        const contentEl =
          fromApi instanceof HTMLElement && fromApi.getAttribute('data-ocm-shell') === 'true'
            ? fromApi
            : ctx.editor.host.querySelector('[data-ocm-shell="true"]');
        if (!(contentEl instanceof HTMLElement)) {
          throw new TypeError(
            'TablePlugin({ surface: "workspace" }) requires createShellView contentTarget (data-ocm-shell)'
          );
        }
        const handle = mountTableWorkspace(ctx.editor, contentEl);
        workspaceRef.current = handle;
        ctx.own({
          destroy: () => {
            workspaceRef.current = null;
            handle.destroy();
          },
        });
        ctx.on('docChanged', () => {
          handle.update(ctx.editor.getState());
        });
        if (toolbarConfig) {
          const bound = bindTableViewModeActive(toolbarConfig, () => workspaceRef.current);
          applyToolbarConfig(ctx, bound, () => ({
            editor: ctx.editor,
            workspace: workspaceRef.current,
          }));
        }
        return;
      }

      const editor = ctx.editor;
      const popup = new TablePopup(editor, ctx.scope);
      const loadedKeys = new Set<string>();
      const inFlight = new Set<string>();

      const insertGrid = (grid: ReturnType<typeof sizedEmptyGrid>) => {
        editor.run(
          insertAtomAfter('tableGrid', { ...attrsFromGrid(grid), height: TABLE_ATOM_DEFAULT_H })
        );
      };

      openInsertTable = () => {
        popup.show((insertOpts) => {
          insertGrid(sizedEmptyGrid(insertOpts.rows, insertOpts.cols, insertOpts.hasHeader));
        });
      };

      openInsertLazy = () => {
        openMatrixImportPopup(editor, {
          mode: 'insert',
          onInsertShell: (config) => {
            const grid = sizedEmptyGrid(2, 2, true);
            grid.source = sourceFromLazy(config);
            insertGrid(grid);
          },
          onMatrix: () => {
            /* insert shell path only */
          },
        });
      };
      openEditLazy = () => {
        const doc = editor.getJSON().doc;
        const gp = findTableGridPath(doc, editor.getSelection().anchor.path);
        if (!gp) {
          editor.notify(editor.t('table.noTableSelected'));
          return;
        }
        const node = core.getNodeAt(doc, gp);
        const src = normalizeTableGrid(node?.attrs).source;
        openMatrixImportPopup(editor, {
          mode: 'edit',
          initial: src
            ? lazyConfigFromSource(src)
            : { url: '', format: 'json', headers: true, delimiter: ',' },
          onMatrix: (matrix, hasHeader, config) => {
            const next = gridFromMatrix(matrix, hasHeader);
            next.source = sourceFromLazy(config);
            editor.run(() => [{ type: 'set_attrs', path: gp, attrs: attrsFromGrid(next) }]);
          },
        });
      };
      refreshLazy = () => {
        const doc = editor.getJSON().doc;
        const gp = findTableGridPath(doc, editor.getSelection().anchor.path);
        if (!gp) {
          editor.notify(editor.t('table.noTableSelected'));
          return;
        }
        const node = core.getNodeAt(doc, gp);
        const src = normalizeTableGrid(node?.attrs).source;
        if (!src) {
          openEditLazy?.();
          return;
        }
        const key = lazyKey(node?.id, src.url, gp[0] ?? 0);
        loadedKeys.delete(key);
        inFlight.delete(key);
        void (async () => {
          inFlight.add(key);
          try {
            if (await applyGridSource(editor, gp, src)) {
              loadedKeys.add(key);
            }
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            editor.notify(msg);
          } finally {
            inFlight.delete(key);
          }
        })();
      };

      ctx.toolbar.add({
        id: 'table',
        icon: tableIcon,
        title: () => editor.t('table.insert'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 40 }, options),
        onClick: () => {
          openInsertTable?.();
        },
      });
      ctx.toolbar.add({
        id: 'lazy-table',
        icon: lazyTableIcon,
        title: () => editor.t('table.lazyTable'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 41 }, options),
        onClick: () => {
          openInsertLazy?.();
        },
      });

      const tryAutoload = () => {
        const doc = editor.getJSON().doc;
        for (const [i, block] of (doc.content ?? []).entries()) {
          if (block.type !== 'tableGrid') {
            continue;
          }
          const src = normalizeTableGrid(block.attrs).source;
          if (!src) {
            continue;
          }
          const key = lazyKey(block.id, src.url, i);
          if (loadedKeys.has(key) || inFlight.has(key)) {
            continue;
          }
          inFlight.add(key);
          void (async () => {
            try {
              if (await applyGridSource(editor, [i], src)) {
                loadedKeys.add(key);
              }
            } catch {
              /* leave placeholder */
            } finally {
              inFlight.delete(key);
            }
          })();
        }
      };
      tryAutoload();
      ctx.on('docChanged', () => {
        tryAutoload();
      });
    },
  });
}

export function createDefaultPlugins(
  opts: { toolbar?: TableToolbarOptions } = {}
): PluginDefinition[] {
  return [
    TablePlugin({
      surface: 'workspace',
      toolbar: opts.toolbar ?? defaultTableToolbar(),
    }),
  ];
}

export default TablePlugin;
