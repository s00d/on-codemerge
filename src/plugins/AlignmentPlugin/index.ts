import './style.scss';

import { definePlugin, setBlockAttr, core, findAncestorPath } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
import { alignLeftIcon, alignCenterIcon, alignRightIcon, alignJustifyIcon } from '../../icons';

function attrStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function selectedAlign(editor: EditorAPI): string {
  const state = editor.getState();
  const path = state.selection.anchor.path;
  if (path.length === 0) {
    return '';
  }
  try {
    const cell = findAncestorPath(state.doc, path, 'tableCell');
    if (cell) {
      return attrStr(core.getNodeAt(state.doc, cell).attrs?.align);
    }
    const listItem = findAncestorPath(state.doc, path, 'listItem');
    if (listItem) {
      return attrStr(core.getNodeAt(state.doc, listItem).attrs?.align);
    }
    const root = core.getNodeAt(state.doc, [path[0] ?? 0]);
    return attrStr(root.attrs?.align);
  } catch {
    return '';
  }
}

export function AlignmentPlugin() {
  return definePlugin({
    name: 'alignment',
    commands: {
      alignLeft: setBlockAttr('align', 'left'),
      alignCenter: setBlockAttr('align', 'center'),
      alignRight: setBlockAttr('align', 'right'),
      alignJustify: setBlockAttr('align', 'justify'),
    },
    hotkeys: [
      { keys: 'Mod-Shift-l', command: 'alignLeft', description: 'Align left' },
      { keys: 'Mod-Shift-e', command: 'alignCenter', description: 'Align center' },
      { keys: 'Mod-Shift-r', command: 'alignRight', description: 'Align right' },
      { keys: 'Mod-Shift-j', command: 'alignJustify', description: 'Justify' },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const buttons = [
        {
          id: 'align-left',
          icon: alignLeftIcon,
          titleKey: 'alignment.alignLeft',
          cmd: 'alignLeft',
          value: 'left',
          order: 30,
        },
        {
          id: 'align-center',
          icon: alignCenterIcon,
          titleKey: 'alignment.alignCenter',
          cmd: 'alignCenter',
          value: 'center',
          order: 31,
        },
        {
          id: 'align-right',
          icon: alignRightIcon,
          titleKey: 'alignment.alignRight',
          cmd: 'alignRight',
          value: 'right',
          order: 32,
        },
        {
          id: 'align-justify',
          icon: alignJustifyIcon,
          titleKey: 'blockStyle.align.justify',
          cmd: 'alignJustify',
          value: 'justify',
          order: 33,
        },
      ];
      for (const b of buttons) {
        ctx.toolbar.add({
          id: b.id,
          icon: b.icon,
          title: () => editor.t(b.titleKey),
          group: 'format',
          order: b.order,
          active: () => selectedAlign(editor) === b.value,
          onClick: () => editor.command(b.cmd),
        });
      }
      ctx.scope.disposable(
        editor.on('selectionChanged', () => {
          editor.toolbar.refresh();
        })
      );
      ctx.scope.disposable(
        editor.on('docChanged', () => {
          editor.toolbar.refresh();
        })
      );
    },
  });
}
