import {
  alignCenterIcon,
  alignLeftIcon,
  alignRightIcon,
  bracesIcon,
  formatIcon,
  insertIcon,
  listIcon,
  splitHorizontalIcon,
  splitVerticalIcon,
} from '@codemerge/sdk/icons';
import type { CellAlign } from '../io/adapters';
import { DEFAULT_ROW_HEIGHT } from '../grid/viewport';
import type { TableWorkspaceHandle } from '../surface/workspaceView';
import type { TableToolbarItem, TableToolbarOptions } from './types';

function applyAlign(workspace: TableWorkspaceHandle | undefined, align: CellAlign): void {
  const store = workspace?.getStore();
  const active = store?.getSelection().active;
  if (!store || !active) {
    return;
  }
  const ri = store.getSheetRowIds().indexOf(active.rowId);
  const got = store.ensureCell(ri >= 0 ? ri : 0, active.colId);
  if (got) {
    store.setCellStyle(got.rowId, got.colId, { align });
  }
}

export function defaultTableToolbar(): TableToolbarOptions {
  const items: TableToolbarItem[] = [
    {
      id: 'table-mode-grid',
      icon: listIcon,
      title: () => 'Grid',
      group: 'history',
      order: 4,
      run: ({ editor, workspace }) => {
        if (workspace?.isRawDirty()) {
          editor.notify('Apply or Discard raw draft first');
          return;
        }
        workspace?.setMode('grid');
        editor.toolbar.refresh();
      },
    },
    {
      id: 'table-mode-raw',
      icon: bracesIcon,
      title: () => 'Raw',
      group: 'history',
      order: 5,
      run: ({ editor, workspace }) => {
        workspace?.setMode('raw');
        editor.toolbar.refresh();
      },
    },
    {
      id: 'table-add-row',
      icon: insertIcon,
      label: () => 'Add row',
      title: () => 'Add row',
      menu: 'table',
      order: 10,
      run: ({ workspace }) => {
        workspace?.addRow();
      },
    },
    {
      id: 'table-add-column',
      icon: insertIcon,
      label: () => 'Add column',
      title: () => 'Add column',
      menu: 'table',
      order: 11,
      run: ({ workspace }) => {
        workspace?.addColumn();
      },
    },
    {
      id: 'table-merge-h',
      icon: splitHorizontalIcon,
      label: () => 'Merge right',
      title: () => 'Merge right',
      menu: 'table',
      order: 12,
      run: ({ workspace }) => {
        workspace?.mergeHorizontal();
      },
    },
    {
      id: 'table-merge-v',
      icon: splitVerticalIcon,
      label: () => 'Merge down',
      title: () => 'Merge down',
      menu: 'table',
      order: 13,
      run: ({ workspace }) => {
        workspace?.mergeVertical();
      },
    },
    {
      id: 'table-split',
      icon: splitHorizontalIcon,
      label: () => 'Split cell',
      title: () => 'Split cell',
      menu: 'table',
      order: 14,
      run: ({ workspace }) => {
        workspace?.splitCell();
      },
    },
    {
      id: 'table-align-left',
      icon: alignLeftIcon,
      label: () => 'Align left',
      title: () => 'Align left',
      menu: 'table',
      order: 15,
      run: ({ workspace }) => {
        applyAlign(workspace ?? undefined, 'left');
      },
    },
    {
      id: 'table-align-center',
      icon: alignCenterIcon,
      label: () => 'Align center',
      title: () => 'Align center',
      menu: 'table',
      order: 16,
      run: ({ workspace }) => {
        applyAlign(workspace ?? undefined, 'center');
      },
    },
    {
      id: 'table-align-right',
      icon: alignRightIcon,
      label: () => 'Align right',
      title: () => 'Align right',
      menu: 'table',
      order: 17,
      run: ({ workspace }) => {
        applyAlign(workspace ?? undefined, 'right');
      },
    },
    {
      id: 'table-format-cell',
      icon: formatIcon,
      label: () => 'Format cell…',
      title: () => 'Cell background, text, border',
      menu: 'table',
      order: 17.5,
      run: ({ workspace }) => {
        workspace?.formatCell();
      },
    },
    {
      id: 'table-fit-fill',
      label: () => 'Fit to window',
      title: () => 'Stretch columns to editor width',
      menu: 'table',
      order: 18,
      run: ({ workspace }) => {
        workspace?.getStore()?.setView({ fit: 'fill' });
      },
    },
    {
      id: 'table-fit-content',
      label: () => 'Content width',
      title: () => 'Use stored column widths',
      menu: 'table',
      order: 19,
      run: ({ workspace }) => {
        workspace?.getStore()?.setView({ fit: 'content' });
      },
    },
    {
      id: 'table-col-width',
      label: () => 'Column size…',
      title: () => 'Set active column width',
      menu: 'table',
      order: 19.5,
      run: ({ editor, workspace }) => {
        const store = workspace?.getStore();
        const active = store?.getSelection().active;
        if (!store || !active) {
          editor.notify('Select a cell first');
          return;
        }
        const width = store.getColumnWidths().get(active.colId) ?? 128;
        const rowHeight = store.getDoc().view?.rowHeight ?? DEFAULT_ROW_HEIGHT;
        editor.ui.popup.open({
          title: 'Size',
          items: [
            {
              type: 'number',
              id: 'width',
              label: 'Column width',
              value: width,
            },
            {
              type: 'number',
              id: 'rowHeight',
              label: 'Row height',
              value: rowHeight,
            },
          ],
          buttons: [
            {
              label: 'Apply',
              variant: 'primary',
              onClick: (v) => {
                const w = Number(v.width);
                if (Number.isFinite(w) && w > 0) {
                  store.setColumnMeta(active.colId, { width: Math.max(64, Math.round(w)) });
                }
                const rh = Number(v.rowHeight);
                if (Number.isFinite(rh) && rh > 0) {
                  store.setView({ rowHeight: Math.min(96, Math.max(20, Math.round(rh))) });
                }
                return true;
              },
            },
          ],
        });
      },
    },
    {
      id: 'table-import-url',
      label: () => 'Import URL',
      title: () => 'Import JSON/CSV from URL',
      menu: 'table',
      order: 20,
      run: ({ workspace }) => {
        workspace?.openImport();
      },
    },
    {
      id: 'table-refresh-source',
      label: () => 'Refresh data',
      title: () => 'Re-fetch source URL',
      menu: 'table',
      order: 20.5,
      run: ({ workspace }) => {
        workspace?.refreshSource();
      },
    },
    {
      id: 'table-edit-source',
      label: () => 'Edit source…',
      title: () => 'Change data URL',
      menu: 'table',
      order: 20.6,
      run: ({ workspace }) => {
        workspace?.editSource();
      },
    },
    {
      id: 'table-export-csv',
      label: () => 'Export CSV',
      title: () => 'Download CSV',
      menu: 'table',
      order: 21,
      command: 'table.exportCsv',
    },
    {
      id: 'table-search',
      label: () => 'Search…',
      title: () => 'Quick filter',
      menu: 'table',
      order: 30,
      run: ({ editor, workspace }) => {
        if (workspace?.isRawDirty()) {
          editor.notify('Apply or Discard raw draft first');
          return;
        }
        const store = workspace?.getStore();
        if (!store) {
          return;
        }
        const current = store.getDoc().view?.quickFilter ?? '';
        editor.ui.popup.open({
          title: 'Quick filter',
          items: [
            {
              type: 'input',
              id: 'q',
              label: 'Contains',
              value: current,
            },
          ],
          buttons: [
            {
              label: 'Apply',
              variant: 'primary',
              onClick: (v) => {
                store.setView({ quickFilter: String(v.q ?? '') });
                return true;
              },
            },
            {
              label: 'Clear',
              onClick: () => {
                store.setView({ quickFilter: '' });
                return true;
              },
            },
          ],
        });
      },
    },
    {
      id: 'table-group-by',
      label: () => 'Group by…',
      title: () => 'Group rows by column',
      menu: 'table',
      order: 31,
      run: ({ editor, workspace }) => {
        if (workspace?.isRawDirty()) {
          editor.notify('Apply or Discard raw draft first');
          return;
        }
        const store = workspace?.getStore();
        if (!store) {
          return;
        }
        const cols = store.getDoc().columns;
        const current = store.getDoc().view?.groupBy?.[0] ?? '';
        const options = ['(none)', ...cols.map((c) => c.id)];
        editor.ui.popup.open({
          title: 'Group by',
          items: [
            {
              type: 'list',
              id: 'col',
              label: 'Column id',
              value: current || '(none)',
              options,
            },
          ],
          buttons: [
            {
              label: 'Apply',
              variant: 'primary',
              onClick: (v) => {
                const colId = String(v.col ?? '');
                const groupBy = colId && colId !== '(none)' ? [colId] : [];
                store.setView({ groupBy, expandedGroupIds: undefined });
                return true;
              },
            },
          ],
        });
      },
    },
  ];

  return {
    menus: [{ id: 'table', label: () => 'Table', order: 10 }],
    items,
  };
}

export function bindTableViewModeActive(
  toolbar: TableToolbarOptions,
  workspace: () => TableWorkspaceHandle | null
): TableToolbarOptions {
  const modeOf = (want: 'grid' | 'raw') => (): boolean => workspace()?.getMode() === want;
  return {
    ...toolbar,
    items: (toolbar.items ?? []).map((item) => {
      if (item.id === 'table-mode-grid') {
        return { ...item, active: modeOf('grid') };
      }
      if (item.id === 'table-mode-raw') {
        return { ...item, active: modeOf('raw') };
      }
      return item;
    }),
  };
}
