import './style.scss';
import { tableIcon, lazyTableIcon } from '../../icons';
import { definePlugin, core } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
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
import type { LazyTableConfig } from './lazyTable';
import {
  fetchLazyMatrix,
  fillTableFromMatrix,
  insertLazyTableShell,
  readLazyConfigFromTable,
} from './lazyTable';

const lazyKey = (id: string | undefined, url: string, index: number) => `${id ?? index}:${url}`;

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

function openLazyPopup(
  editor: EditorAPI,
  mode: 'insert' | 'edit',
  initial: Partial<LazyTableConfig> = {}
): void {
  editor.ui.popup.open({
    title: mode === 'insert' ? editor.t('table.lazyTable') : editor.t('table.editLazy'),
    items: [
      { type: 'url', id: 'url', label: editor.t('common.dataUrl'), value: initial.url ?? '' },
      {
        type: 'list',
        id: 'format',
        label: editor.t('common.format'),
        options: ['json', 'csv'],
        value: initial.format ?? 'json',
      },
      {
        type: 'checkbox',
        id: 'header',
        label: editor.t('table.includeHeaderRow'),
        value: initial.headers !== false,
      },
      {
        type: 'input',
        id: 'delimiter',
        label: editor.t('table.csvDelimiter2'),
        value: initial.delimiter ?? ',',
      },
    ],
    buttons: [
      {
        label: editor.t('common.load'),
        variant: 'primary',
        onClick: (v) => {
          const config: LazyTableConfig = {
            url: String(v.url ?? '').trim(),
            format: v.format === 'csv' ? 'csv' : 'json',
            headers: Boolean(v.header),
            delimiter: String(v.delimiter ?? ',') || ',',
          };
          if (!config.url) {
            editor.notify(editor.t('common.dataUrlIsRequired'));
            return true;
          }
          void (async () => {
            if (mode === 'insert') {
              editor.run(insertLazyTableShell(config));
              // Autoload on docChanged will fetch; avoid double applyLazyLoad.
              return;
            }
            await applyLazyLoad(editor, config);
          })();
          return true;
        },
      },
    ],
  });
}

export function TablePlugin() {
  let openInsertLazy: (() => void) | null = null;
  let openEditLazy: (() => void) | null = null;
  let refreshLazy: (() => void) | null = null;

  return definePlugin({
    commands: {
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
    },
    hotkeys: [
      { keys: 'Mod-Shift-t', command: 'insertTable', description: 'Insert table' },
      { keys: 'Mod-Shift-u', command: 'insertLazyTable', description: 'Insert lazy table' },
      { keys: 'Mod-Alt-k', command: 'editLazyTable', description: 'Edit lazy table' },
    ],
    name: 'table',
    nodes: [
      {
        name: 'table',
        group: 'block',
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
      { name: 'tableRow', group: 'block' },
      { name: 'tableCell', group: 'block' },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const popup = new TablePopup(editor, ctx.scope);
      const loadedKeys = new Set<string>();
      const inFlight = new Set<string>();

      openInsertLazy = () => {
        openLazyPopup(editor, 'insert');
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
        openLazyPopup(editor, 'edit', cfg);
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
        void applyLazyLoad(editor, cfg).then((ok) => {
          if (ok) {
            loadedKeys.add(key);
          }
          return ok;
        });
      };

      ctx.toolbar.add({
        id: 'table',
        icon: tableIcon,
        title: editor.t('table.insert'),
        menu: 'insert',
        order: 40,
        onClick: () => {
          popup.show((options) => {
            editor.run(insertTableCommand(options.rows, options.cols, options.hasHeader));
          });
        },
      });
      ctx.toolbar.add({
        id: 'lazy-table',
        icon: lazyTableIcon,
        title: editor.t('table.lazyTable'),
        menu: 'insert',
        order: 41,
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

      // Auto-fetch once per table id+url (HTML import / setJSON / insert shell).
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
