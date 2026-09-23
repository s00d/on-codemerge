import type { EditorAPI, MenuItem } from '@on-codemerge/sdk';
import { core } from '@on-codemerge/sdk';
import { asAttr } from '../../../utils/asAttr';
import { colorWellView } from '../../../utils/ColorWell';
import {
  addColumn,
  addHeaderRow,
  addRow,
  clearCell,
  clearTable,
  copyCellText,
  deleteColumn,
  deleteRow,
  deleteTable,
  findTablePath,
  importTableFromHtml,
  mergeCellsHorizontal,
  mergeCellsVertical,
  pasteCellText,
  removeHeaderRow,
  setCellAttr,
  setTableAttr,
  sortTableByColumn,
  splitCellHorizontal,
} from '../tableOps';
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
  deleteTableIcon,
  editIcon,
  exportIcon,
  formatIcon,
  h1Icon,
  htmlIcon,
  insertIcon,
  lazyTableIcon,
  listIcon,
  listNumberedIcon,
  redoIcon,
  splitHorizontalIcon,
  splitVerticalIcon,
  styleIcon,
  tableIcon,
  uploadIcon,
} from '../../../icons';

let cellClipboard = '';

function cellTextAt(editor: EditorAPI): string {
  const path = editor.getSelection().anchor.path;
  if (path.length < 3) {
    return '';
  }
  try {
    const cell = core.getNodeAt(editor.getJSON().doc, path.slice(0, 3));
    return (cell.content ?? [])
      .map((p) => (p.content ?? []).map((c) => c.text ?? '').join(''))
      .join('\n');
  } catch {
    return '';
  }
}

/** Compact nested context menu for tables. */
export function buildTableContextMenu(
  editor: EditorAPI,
  lazy?: {
    onLazyInsert?: () => void;
    onLazyEdit?: () => void;
    onLazyRefresh?: () => void;
  }
): MenuItem[] {
  const t = (k: string) => editor.t(k) || k;
  const col = editor.getSelection().anchor.path[2] ?? 0;
  const run = (cmd: Parameters<EditorAPI['run']>[0]) => () => {
    editor.run(cmd);
  };

  const openFormatCell = () => {
    let pendingBg = '#ffffff';
    try {
      const path = editor.getSelection().anchor.path;
      if (path.length >= 3) {
        const cell = core.getNodeAt(editor.getJSON().doc, path.slice(0, 3));
        const bg = cell.attrs?.background;
        if (typeof bg === 'string' && bg) {
          pendingBg = bg;
        }
      }
    } catch {
      /* ignore */
    }

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
                  editor.run(setCellAttr('background', hex));
                },
                onClear: () => {
                  pendingBg = '';
                  editor.run(setCellAttr('background', ''));
                },
              },
              (k) => editor.t(k)
            ),
        },
        {
          type: 'list',
          id: 'align',
          label: t('Align'),
          options: ['left', 'center', 'right'],
          value: 'left',
        },
        {
          type: 'list',
          id: 'border',
          label: t('Border'),
          options: ['none', 'thin', 'medium', 'thick'],
          value: 'thin',
        },
      ],
      buttons: [
        {
          label: t('common.apply'),
          variant: 'primary',
          onClick: (v) => {
            editor.run(setCellAttr('align', String(v.align)));
            editor.run(setCellAttr('border', String(v.border)));
          },
        },
      ],
    });
  };

  const openProperties = () => {
    const doc = editor.getJSON().doc;
    const tp = findTablePath(doc, editor.getSelection().anchor.path);
    const table = tp ? doc.content?.[tp[0]] : null;
    editor.ui.popup.open({
      title: t('table.tableProperties'),
      className: 'table-popup',
      items: [
        {
          type: 'number',
          id: 'cols',
          label: t('Columns'),
          value: Number(table?.attrs?.cols ?? 2),
        },
        {
          type: 'list',
          id: 'style',
          label: t('Style'),
          options: ['default', 'modern', 'bordered', 'striped'],
          value: asAttr(table?.attrs?.tableStyle, 'default'),
        },
        {
          type: 'checkbox',
          id: 'responsive',
          label: t('responsive.title'),
          value: Boolean(table?.attrs?.responsive),
        },
        {
          type: 'checkbox',
          id: 'autofit',
          label: t('common.autoFit'),
          value: Boolean(table?.attrs?.autofit),
        },
      ],
      buttons: [
        {
          label: t('common.apply'),
          variant: 'primary',
          onClick: (v) => {
            editor.run(setTableAttr('cols', Number(v.cols) || 2));
            editor.run(setTableAttr('tableStyle', String(v.style)));
            editor.run(setTableAttr('responsive', Boolean(v.responsive)));
            editor.run(setTableAttr('autofit', Boolean(v.autofit)));
          },
        },
      ],
    });
  };

  const openImport = () => {
    editor.ui.popup.open({
      title: t('Import Table HTML'),
      items: [
        {
          type: 'textarea',
          id: 'html',
          label: t('common.html'),
          value: '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>',
        },
      ],
      buttons: [
        {
          label: t('common.import'),
          variant: 'primary',
          onClick: (v) => {
            const ok = editor.run(importTableFromHtml(String(v.html ?? '')));
            if (!ok) {
              editor.notify(t('No table found'));
            }
          },
        },
      ],
    });
  };

  return [
    {
      label: t('common.insert'),
      icon: insertIcon,
      subMenu: [
        { label: t('Row Above'), icon: insertIcon, onClick: run(addRow('above')) },
        { label: t('Row Below'), icon: insertIcon, onClick: run(addRow('below')) },
        { type: 'divider' },
        { label: t('Column Left'), icon: insertIcon, onClick: run(addColumn('left')) },
        { label: t('Column Right'), icon: insertIcon, onClick: run(addColumn('right')) },
      ],
    },
    {
      label: t('common.delete'),
      icon: deleteIcon,
      subMenu: [
        {
          label: t('table.deleteRow'),
          icon: deleteRowIcon,
          variant: 'danger',
          onClick: run(deleteRow),
        },
        {
          label: t('table.deleteColumn'),
          icon: deleteColumnIcon,
          variant: 'danger',
          onClick: run(deleteColumn),
        },
        { label: t('table.clearCell'), icon: clearIcon, onClick: run(clearCell) },
        { type: 'divider' },
        { label: t('table.clearTable'), icon: clearIcon, onClick: run(clearTable) },
        {
          label: t('table.deleteTable'),
          icon: deleteTableIcon,
          variant: 'danger',
          onClick: run(deleteTable),
        },
      ],
    },
    {
      label: t('table.cells'),
      icon: tableIcon,
      subMenu: [
        {
          label: t('block.mergeHorizontally'),
          icon: splitHorizontalIcon,
          onClick: run(mergeCellsHorizontal()),
        },
        {
          label: t('block.mergeVertically'),
          icon: splitVerticalIcon,
          onClick: run(mergeCellsVertical()),
        },
        {
          label: t('table.splitCell'),
          icon: splitHorizontalIcon,
          onClick: run(splitCellHorizontal()),
        },
        { type: 'divider' },
        {
          label: t('table.copyCell'),
          icon: copyIcon,
          onClick: () => {
            cellClipboard = cellTextAt(editor);
            copyCellText(editor);
          },
        },
        {
          label: t('table.cutCell'),
          icon: clearIcon,
          onClick: () => {
            cellClipboard = cellTextAt(editor);
            copyCellText(editor);
            editor.run(clearCell);
          },
        },
        {
          label: t('table.pasteCell'),
          icon: bufferIcon,
          onClick: () => {
            if (cellClipboard) {
              editor.run(pasteCellText(cellClipboard));
            }
          },
        },
      ],
    },
    {
      label: t('Header'),
      icon: h1Icon,
      subMenu: [
        { label: t('Add Header Row'), icon: insertIcon, onClick: run(addHeaderRow) },
        { label: t('Remove Header Row'), icon: deleteRowIcon, onClick: run(removeHeaderRow) },
      ],
    },
    {
      label: t('common.sort'),
      icon: listNumberedIcon,
      subMenu: [
        { label: t('Sort Asc'), icon: listIcon, onClick: run(sortTableByColumn(col, 'asc')) },
        {
          label: t('Sort Desc'),
          icon: listNumberedIcon,
          onClick: run(sortTableByColumn(col, 'desc')),
        },
      ],
    },
    {
      label: t('Style'),
      icon: styleIcon,
      subMenu: [
        { label: t('Modern'), icon: styleIcon, onClick: run(setTableAttr('tableStyle', 'modern')) },
        {
          label: t('Bordered'),
          icon: styleIcon,
          onClick: run(setTableAttr('tableStyle', 'bordered')),
        },
        {
          label: t('Striped'),
          icon: styleIcon,
          onClick: run(setTableAttr('tableStyle', 'striped')),
        },
        {
          label: t('Default'),
          icon: styleIcon,
          onClick: run(setTableAttr('tableStyle', 'default')),
        },
        { type: 'divider' },
        {
          label: t('alignment.alignLeft'),
          icon: alignLeftIcon,
          onClick: run(setCellAttr('align', 'left')),
        },
        {
          label: t('alignment.alignCenter'),
          icon: alignCenterIcon,
          onClick: run(setCellAttr('align', 'center')),
        },
        {
          label: t('alignment.alignRight'),
          icon: alignRightIcon,
          onClick: run(setCellAttr('align', 'right')),
        },
        { type: 'divider' },
        { label: t('Format Cell…'), icon: formatIcon, onClick: openFormatCell },
      ],
    },
    { type: 'divider' },
    { label: t('Table Properties…'), icon: tableIcon, onClick: openProperties },
    {
      label: t('More'),
      icon: htmlIcon,
      subMenu: [
        {
          label: t('Export HTML'),
          icon: exportIcon,
          onClick: () => {
            const html = editor.getHTML();
            const match = /<table[\s\S]*?<\/table>/i.exec(html);
            if (match) {
              void navigator.clipboard?.writeText(match[0]);
              editor.notify(t('Table HTML copied'));
            } else {
              editor.notify(t('No table found'));
            }
          },
        },
        { label: t('Import HTML…'), icon: uploadIcon, onClick: openImport },
        { type: 'divider' },
        {
          label: t('Lazy Table…'),
          icon: lazyTableIcon,
          onClick: () => {
            lazy?.onLazyInsert?.();
          },
        },
        {
          label: t('Edit Lazy Table…'),
          icon: editIcon,
          onClick: () => {
            lazy?.onLazyEdit?.();
          },
        },
        {
          label: t('Refresh Lazy Data'),
          icon: redoIcon,
          onClick: () => {
            lazy?.onLazyRefresh?.();
          },
        },
      ],
    },
  ];
}
