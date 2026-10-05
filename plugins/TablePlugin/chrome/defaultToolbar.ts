import { bracesIcon, insertIcon, listIcon } from '@ocm/wysiwyg/icons';
import type { TableWorkspaceHandle } from '../surface/workspaceView';
import type { TableToolbarItem, TableToolbarOptions } from './types';

export type DefaultTableToolbarOptions = {
  viewMode?: boolean;
};

export function defaultTableToolbar(opts: DefaultTableToolbarOptions = {}): TableToolbarOptions {
  const viewMode = opts.viewMode !== false;
  const items: TableToolbarItem[] = [];

  if (viewMode) {
    items.push(
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
      }
    );
  }

  items.push(
    {
      id: 'table-add-row',
      icon: insertIcon,
      title: () => 'Add row',
      group: 'history',
      order: 10,
      run: ({ workspace }) => {
        workspace?.addRow();
      },
    },
    {
      id: 'table-add-column',
      label: () => '+ col',
      title: () => 'Add column',
      menu: 'table',
      order: 10,
      run: ({ workspace }) => {
        workspace?.addColumn();
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
                // Clear expand set so tree+group both use "all expanded when unset".
                store.setView({ groupBy, expandedGroupIds: undefined });
                return true;
              },
            },
          ],
        });
      },
    }
  );

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
