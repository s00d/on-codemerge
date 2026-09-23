import './style.scss';

import { definePlugin } from '@on-codemerge/sdk';
import { ExportMenu } from './components/ExportMenu';
import { exportIcon } from '../../icons';

export function ExportPlugin() {
  let openExport: (() => void) | null = null;

  return definePlugin({
    name: 'export',
    hotkeys: [{ keys: 'Mod-Alt-e', command: 'exportDoc', description: 'Export' }],
    commands: {
      exportDoc: () => {
        openExport?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new ExportMenu(editor, ctx.scope);
      openExport = () => {
        menu.show();
      };
      ctx.toolbar.add({
        id: 'export',
        icon: exportIcon,
        title: () => editor.t('export.title'),
        menu: 'tools',
        order: 80,
        onClick: () => {
          openExport?.();
        },
      });
    },
  });
}
