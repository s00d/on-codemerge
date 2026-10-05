import { colorWellView } from '@codemerge/sdk';
import type { EditorAPI, MenuItem } from '@codemerge/sdk';
import {
  alignCenterIcon,
  alignLeftIcon,
  alignRightIcon,
  bufferIcon,
  clearIcon,
  copyIcon,
  deleteColumnIcon,
  deleteIcon,
  deleteRowIcon,
  formatIcon,
  insertIcon,
  listIcon,
  listNumberedIcon,
  splitHorizontalIcon,
  splitVerticalIcon,
  styleIcon,
  tableIcon,
} from '@codemerge/sdk/icons';

import { copySelection, pasteFromClipboard } from '../grid/clipboard';
import { spanSize } from '../grid/spans';
import type { TableStore } from '../grid/TableStore';
import { DEFAULT_ROW_HEIGHT } from '../grid/viewport';
import type { CellAlign, CellBorder, CellStyle, TableTheme } from '../io/adapters';

const THEMES: TableTheme[] = ['default', 'modern', 'bordered', 'striped'];

function styleActive(store: TableStore, patch: Partial<CellStyle>): void {
  const active = store.getSelection().active;
  if (!active) {
    return;
  }
  const ri = store.getSheetRowIds().indexOf(active.rowId);
  const got = store.ensureCell(ri >= 0 ? ri : 0, active.colId);
  if (got) {
    store.setCellStyle(got.rowId, got.colId, patch);
  }
}

export function openFormatCell(editor: EditorAPI, store: TableStore): void {
  const t = (k: string) => editor.t(k) || k;
  let active = store.getSelection().active;
  if (!active) {
    return;
  }
  const sheetRows = store.getSheetRowIds();
  const ri = sheetRows.indexOf(active.rowId);
  const ensured = store.ensureCell(ri >= 0 ? ri : 0, active.colId);
  if (!ensured) {
    return;
  }
  active = ensured;
  const current = store.getDoc().rows.find((r) => r.id === active.rowId)?.styles?.[active.colId];
  let pendingBg = current?.background ?? '#ffffff';
  let pendingFg = current?.color ?? '#18181b';

  editor.ui.popup.open({
    title: t('table.formatCell'),
    className: 'table-popup',
    size: 'sm',
    closeOnClickOutside: true,
    items: [
      {
        type: 'view',
        id: 'bg-well',
        label: t('color.background'),
        view: () =>
          colorWellView(
            {
              initial: pendingBg,
              onPick: (hex) => {
                pendingBg = hex;
                store.setCellStyle(active.rowId, active.colId, { background: hex });
              },
              onClear: () => {
                pendingBg = '';
                store.setCellStyle(active.rowId, active.colId, { background: '' });
              },
            },
            (k) => editor.t(k)
          ),
      },
      {
        type: 'view',
        id: 'fg-well',
        label: t('color.text'),
        view: () =>
          colorWellView(
            {
              initial: pendingFg,
              onPick: (hex) => {
                pendingFg = hex;
                store.setCellStyle(active.rowId, active.colId, { color: hex });
              },
              onClear: () => {
                pendingFg = '';
                store.setCellStyle(active.rowId, active.colId, { color: '' });
              },
            },
            (k) => editor.t(k)
          ),
      },
      {
        type: 'list',
        id: 'align',
        label: t('alignment.title'),
        options: ['left', 'center', 'right'],
        value: current?.align ?? 'left',
      },
      {
        type: 'list',
        id: 'border',
        label: t('table.setCellBorder'),
        options: ['none', 'thin', 'medium', 'thick'],
        value: current?.border ?? 'thin',
      },
    ],
    buttons: [
      {
        label: t('common.apply'),
        variant: 'primary',
        onClick: (v) => {
          const align: CellAlign = v.align === 'center' || v.align === 'right' ? v.align : 'left';
          const border: CellBorder =
            v.border === 'none' || v.border === 'medium' || v.border === 'thick'
              ? v.border
              : 'thin';
          store.setCellStyle(active.rowId, active.colId, { align, border });
          return true;
        },
      },
    ],
  });
}

function openProperties(editor: EditorAPI, store: TableStore): void {
  const t = (k: string) => editor.t(k) || k;
  const doc = store.getDoc();
  editor.ui.popup.open({
    title: t('table.tableProperties'),
    className: 'table-popup',
    items: [
      {
        type: 'list',
        id: 'theme',
        label: t('table.tableStyle'),
        options: THEMES,
        value: doc.theme ?? 'default',
      },
      {
        type: 'list',
        id: 'fit',
        label: 'Table width',
        options: ['stretch', 'fixed'],
        value: doc.view?.fit === 'content' ? 'fixed' : 'stretch',
      },
      {
        type: 'number',
        id: 'rowHeight',
        label: 'Row height',
        value: store.getDoc().view?.rowHeight ?? DEFAULT_ROW_HEIGHT,
      },
      {
        type: 'number',
        id: 'colWidth',
        label: 'Column width',
        value: store.getSelection().active
          ? (store.getColumnWidths().get(store.getSelection().active?.colId ?? '') ?? 128)
          : 128,
      },
    ],
    buttons: [
      {
        label: t('common.apply'),
        variant: 'primary',
        onClick: (v) => {
          const theme =
            v.theme === 'modern' || v.theme === 'bordered' || v.theme === 'striped'
              ? v.theme
              : 'default';
          store.setTheme(theme);
          const fit = String(v.fit);
          store.setView({ fit: fit === 'fixed' || fit === 'content' ? 'content' : 'fill' });
          const rowHeight = Number(v.rowHeight);
          if (Number.isFinite(rowHeight) && rowHeight > 0) {
            store.setView({ rowHeight: Math.min(96, Math.max(20, Math.round(rowHeight))) });
          }
          const colWidth = Number(v.colWidth);
          const colId = store.getSelection().active?.colId;
          if (colId && Number.isFinite(colWidth) && colWidth > 0) {
            store.setColumnMeta(colId, { width: Math.max(64, Math.round(colWidth)) });
          }
          return true;
        },
      },
    ],
  });
}

export function buildGridContextMenu(
  editor: EditorAPI,
  store: TableStore,
  extras?: {
    onImport?: () => void;
    onRefresh?: () => void;
    onEditSource?: () => void;
  }
): MenuItem[] {
  const t = (k: string) => editor.t(k) || k;
  const active = store.getSelection().active;
  const span = active
    ? spanSize(store.getDoc().rows.find((r) => r.id === active.rowId)?.spans?.[active.colId])
    : { cols: 1, rows: 1 };
  const hasCell = Boolean(active);
  const sortCol = (dir: 'asc' | 'desc') => () => {
    if (!active) {
      return;
    }
    store.setView({ sort: [{ colId: active.colId, dir }] });
  };

  return [
    {
      label: t('common.insert'),
      icon: insertIcon,
      subMenu: [
        {
          label: t('table.addRowAbove'),
          icon: insertIcon,
          disabled: !hasCell,
          onClick: () => {
            if (active) {
              store.addRow(active.rowId, { before: true });
            }
          },
        },
        {
          label: t('table.addRowBelow'),
          icon: insertIcon,
          onClick: () => {
            store.addRow(active?.rowId);
          },
        },
        { type: 'divider' },
        {
          label: t('table.addColumnLeft'),
          icon: insertIcon,
          disabled: !hasCell,
          onClick: () => {
            if (active) {
              store.addColumn(undefined, { beforeColId: active.colId });
            }
          },
        },
        {
          label: t('table.addColumnRight'),
          icon: insertIcon,
          onClick: () => {
            if (active) {
              store.addColumn(undefined, { afterColId: active.colId });
            } else {
              store.addColumn();
            }
          },
        },
      ],
    },
    {
      label: t('common.delete'),
      icon: deleteIcon,
      subMenu: [
        {
          label: t('table.deleteRow'),
          icon: deleteRowIcon,
          disabled: !hasCell,
          variant: 'danger',
          onClick: () => {
            if (active) {
              store.deleteRow(active.rowId);
            }
          },
        },
        {
          label: t('table.deleteColumn'),
          icon: deleteColumnIcon,
          disabled: !hasCell,
          variant: 'danger',
          onClick: () => {
            if (active) {
              store.deleteColumn(active.colId);
            }
          },
        },
        {
          label: t('table.clearCell'),
          icon: clearIcon,
          disabled: !hasCell,
          onClick: () => {
            if (active) {
              store.clearCell(active.rowId, active.colId);
            }
          },
        },
        { type: 'divider' },
        {
          label: t('table.clearTable'),
          icon: clearIcon,
          onClick: () => {
            store.clearTable();
          },
        },
      ],
    },
    {
      label: t('table.cells'),
      icon: tableIcon,
      subMenu: [
        {
          label: t('table.mergeCells'),
          icon: splitHorizontalIcon,
          disabled: !hasCell,
          onClick: () => {
            store.mergeHorizontal();
          },
        },
        {
          label: t('table.mergeCells') + ' ↓',
          icon: splitVerticalIcon,
          disabled: !hasCell,
          onClick: () => {
            store.mergeVertical();
          },
        },
        {
          label: t('table.splitCell'),
          icon: splitHorizontalIcon,
          disabled: span.cols <= 1 && span.rows <= 1,
          onClick: () => {
            store.splitActive();
          },
        },
        { type: 'divider' },
        {
          label: t('table.copyCell'),
          icon: copyIcon,
          disabled: !hasCell,
          onClick: () => {
            void copySelection(store);
          },
        },
        {
          label: t('table.cutCell'),
          icon: clearIcon,
          disabled: !hasCell,
          onClick: () => {
            void (async () => {
              await copySelection(store);
              if (active) {
                store.clearCell(active.rowId, active.colId);
              }
            })();
          },
        },
        {
          label: t('table.pasteCell'),
          icon: bufferIcon,
          disabled: !hasCell,
          onClick: () => {
            void pasteFromClipboard(store);
          },
        },
      ],
    },
    {
      label: t('common.sort'),
      icon: listNumberedIcon,
      subMenu: [
        {
          label: t('table.sortTable') + ' ↑',
          icon: listIcon,
          disabled: !hasCell,
          onClick: sortCol('asc'),
        },
        {
          label: t('table.sortTable') + ' ↓',
          icon: listNumberedIcon,
          disabled: !hasCell,
          onClick: sortCol('desc'),
        },
      ],
    },
    {
      label: t('table.tableStyle'),
      icon: styleIcon,
      subMenu: [
        ...THEMES.map((theme) => ({
          label: theme.charAt(0).toUpperCase() + theme.slice(1),
          icon: styleIcon,
          onClick: () => {
            store.setTheme(theme);
          },
        })),
        { type: 'divider' as const },
        {
          label: t('alignment.alignLeft'),
          icon: alignLeftIcon,
          disabled: !hasCell,
          onClick: () => {
            styleActive(store, { align: 'left' });
          },
        },
        {
          label: t('alignment.alignCenter'),
          icon: alignCenterIcon,
          disabled: !hasCell,
          onClick: () => {
            styleActive(store, { align: 'center' });
          },
        },
        {
          label: t('alignment.alignRight'),
          icon: alignRightIcon,
          disabled: !hasCell,
          onClick: () => {
            styleActive(store, { align: 'right' });
          },
        },
        { type: 'divider' as const },
        {
          label: t('table.formatCell'),
          icon: formatIcon,
          disabled: !hasCell,
          onClick: () => {
            openFormatCell(editor, store);
          },
        },
      ],
    },
    { type: 'divider' },
    ...(extras?.onImport
      ? [
          {
            label: t('table.importTable'),
            icon: insertIcon,
            onClick: () => extras.onImport?.(),
          },
        ]
      : []),
    ...(extras?.onRefresh
      ? [
          {
            label: t('table.fillTable') || 'Refresh data',
            icon: insertIcon,
            disabled: !store.getDoc().source?.url,
            onClick: () => extras.onRefresh?.(),
          },
        ]
      : []),
    ...(extras?.onEditSource
      ? [
          {
            label: t('table.editLazy') || 'Edit source…',
            icon: insertIcon,
            onClick: () => extras.onEditSource?.(),
          },
        ]
      : []),
    { type: 'divider' },
    {
      label: t('table.tableProperties'),
      icon: tableIcon,
      onClick: () => {
        openProperties(editor, store);
      },
    },
  ];
}
