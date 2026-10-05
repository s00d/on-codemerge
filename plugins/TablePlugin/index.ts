import { applyToolbarConfig, definePlugin, core, pluginToolbarPlacement } from '@codemerge/sdk';
import type { EditorAPI, PluginDefinition, PluginToolbarOpts } from '@codemerge/sdk';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import type { Command } from '@codemerge/kernel';
import { tableIcon, lazyTableIcon } from '@codemerge/sdk/icons';

import { TablePopup } from './components/TablePopup';
import { buildTableContextMenu } from './components/tableContextMenu';
import {
  addColumn,
  addHeaderRow,
  addRow,
  clearCell,
  clearTable,
  deleteColumn,
  deleteRow,
  deleteTable,
  findTablePath,
  insertTableCommand,
  mergeCellsHorizontal,
  mergeCellsVertical,
  removeHeaderRow,
  setTableAttr,
  splitCellHorizontal,
} from './tableOps';
import type { LazyTableConfig } from './io/fetchMatrix';
import { fetchLazyMatrix } from './io/fetchMatrix';
import { fillTableFromMatrix, insertLazyTableShell, readLazyConfigFromTable } from './lazyTable';
import { bindTableViewModeActive, defaultTableToolbar } from './chrome/defaultToolbar';
import { openMatrixImportPopup } from './chrome/importPopup';
import type { TableToolbarOptions } from './chrome/types';
import { isTableEditorDoc } from './io/adapters';
import { mountTableWorkspace } from './surface/workspaceView';
import type { TableWorkspaceHandle } from './surface/workspaceView';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

const lazyKey = (id: string | undefined, url: string, index: number) => `${id ?? index}:${url}`;

export {
  emptyEditorDoc,
  emptyTableGrid,
  isTableEditorDoc,
  gridFromDoc,
  gridFromMatrix,
  docFromGrid,
  toEditorDoc,
  normalizeTableGrid,
  exportCsv,
  gridToHtml,
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

const ATOM_NODES = [
  {
    name: 'table',
    group: 'block' as const,
    attrs: {
      cols: 2,
      hasHeader: false,
      tableStyle: 'default',
      responsive: false,
      autofit: false,
      lazyUrl: '',
      lazyFormat: 'json',
      lazyHeaders: true,
      lazyDelimiter: ',',
    },
  },
  { name: 'tableRow', group: 'block' as const },
  { name: 'tableCell', group: 'block' as const },
];

const WORKSPACE_NODES = [
  {
    name: 'tableGrid',
    group: 'atom' as const,
    atom: true as const,
    attrs: { version: 2, columns: [], rows: [], view: undefined, source: undefined },
  },
];

async function applyLazyLoad(editor: EditorAPI, config: LazyTableConfig): Promise<boolean> {
  try {
    const doc = editor.getJSON().doc;
    const tp = findTablePath(doc, editor.getSelection().anchor.path);
    const tableId = tp ? core.getNodeAt(doc, tp)?.id : undefined;
    const { matrix, hasHeader } = await fetchLazyMatrix(config);
    const ok = editor.run(fillTableFromMatrix(matrix, hasHeader, tableId));
    if (!ok) {
      editor.notify(editor.t('table.noTableSelected'));
      return false;
    }
    editor.run(setTableAttr('lazyUrl', config.url));
    editor.run(setTableAttr('lazyFormat', config.format === 'csv' ? 'csv' : 'json'));
    editor.run(setTableAttr('lazyHeaders', config.headers !== false));
    editor.run(setTableAttr('lazyDelimiter', config.delimiter ?? ','));
    editor.notify(editor.t('table.lazyTableLoaded'));
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    editor.notify(msg);
    return false;
  }
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

  const atomCommands: Record<string, Command> = {
    insertTable: insertTableCommand(3, 3),
    deleteTable,
    addRowBelow: addRow('below'),
    addRowAbove: addRow('above'),
    addColumnLeft: addColumn('left'),
    addColumnRight: addColumn('right'),
    deleteRow,
    deleteColumn,
    clearCell,
    clearTable,
    addHeaderRow,
    removeHeaderRow,
    mergeCellsHorizontal: mergeCellsHorizontal(),
    mergeCellsVertical: mergeCellsVertical(),
    splitCell: splitCellHorizontal(),
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
    nodes: workspace ? WORKSPACE_NODES : ATOM_NODES,
    commands: workspace ? workspaceCommands : atomCommands,
    hotkeys,
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

      openInsertLazy = () => {
        openMatrixImportPopup(editor, {
          mode: 'insert',
          onInsertShell: (config) => {
            editor.run(insertLazyTableShell(config));
          },
          onMatrix: () => {
            /* insert shell path only */
          },
        });
      };
      openEditLazy = () => {
        const tp = findTablePath(editor.getJSON().doc, editor.getSelection().anchor.path);
        if (!tp) {
          editor.notify(editor.t('table.noTableSelected'));
          return;
        }
        const table = core.getNodeAt(editor.getJSON().doc, tp);
        const cfg = readLazyConfigFromTable(table) ?? {
          url: '',
          format: 'json' as const,
          headers: true,
          delimiter: ',',
        };
        openMatrixImportPopup(editor, {
          mode: 'edit',
          initial: cfg,
          onMatrix: (matrix, hasHeader, config) => {
            const doc = editor.getJSON().doc;
            const editPath = findTablePath(doc, editor.getSelection().anchor.path);
            const tableId = editPath ? core.getNodeAt(doc, editPath)?.id : undefined;
            const ok = editor.run(fillTableFromMatrix(matrix, hasHeader, tableId));
            if (!ok) {
              editor.notify(editor.t('table.noTableSelected'));
              return;
            }
            editor.run(setTableAttr('lazyUrl', config.url));
            editor.run(setTableAttr('lazyFormat', config.format === 'csv' ? 'csv' : 'json'));
            editor.run(setTableAttr('lazyHeaders', config.headers !== false));
            editor.run(setTableAttr('lazyDelimiter', config.delimiter ?? ','));
          },
        });
      };
      refreshLazy = () => {
        const tp = findTablePath(editor.getJSON().doc, editor.getSelection().anchor.path);
        if (!tp) {
          editor.notify(editor.t('table.noTableSelected'));
          return;
        }
        const table = core.getNodeAt(editor.getJSON().doc, tp);
        const cfg = readLazyConfigFromTable(table);
        if (!cfg) {
          openEditLazy?.();
          return;
        }
        const key = lazyKey(table.id, cfg.url, tp[0] ?? 0);
        loadedKeys.delete(key);
        void (async () => {
          const ok = await applyLazyLoad(editor, cfg);
          if (ok) {
            loadedKeys.add(key);
          }
        })();
      };

      ctx.toolbar.add({
        id: 'table',
        icon: tableIcon,
        title: () => editor.t('table.insert'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 40 }, options),
        onClick: () => {
          popup.show((insertOpts) => {
            editor.run(insertTableCommand(insertOpts.rows, insertOpts.cols, insertOpts.hasHeader));
          });
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

      ctx.onDom('host', 'contextmenu', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        if (
          !target.closest('[data-ocm-type="table"]') &&
          !target.closest('table.html-editor-table') &&
          !target.closest('.html-editor-table')
        ) {
          return;
        }
        e.preventDefault();
        editor.ui.menu.open(
          buildTableContextMenu(editor, {
            onLazyInsert: () => openInsertLazy?.(),
            onLazyEdit: () => openEditLazy?.(),
            onLazyRefresh: () => refreshLazy?.(),
          }),
          e.clientX,
          e.clientY
        );
      });

      const tryAutoload = () => {
        const doc = editor.getJSON().doc;
        for (const [i, block] of (doc.content ?? []).entries()) {
          if (block.type !== 'table') {
            continue;
          }
          const cfg = readLazyConfigFromTable(block);
          if (!cfg) {
            continue;
          }
          const key = lazyKey(block.id, cfg.url, i);
          if (loadedKeys.has(key) || inFlight.has(key)) {
            continue;
          }
          inFlight.add(key);
          let tableId = block.id;
          if (!tableId) {
            tableId = `table_${Date.now()}_${i}`;
            const stamped = { ...core.cloneNode(block), id: tableId };
            editor.run(() => [
              { type: 'remove_node', path: [], index: i },
              { type: 'insert_node', path: [], index: i, node: stamped },
            ]);
          }
          void (async () => {
            try {
              const { matrix, hasHeader } = await fetchLazyMatrix(cfg);
              if (editor.run(fillTableFromMatrix(matrix, hasHeader, tableId))) {
                loadedKeys.add(key);
              }
            } catch {
              /* leave placeholder; user can Edit Lazy Table */
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
