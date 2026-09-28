import './style.scss';

import { definePlugin, pluginToolbarPlacement } from '@on-codemerge/sdk';
import type { PluginToolbarOpts } from '@on-codemerge/sdk';
import { ExportMenu } from './components/ExportMenu';
import { exportIcon } from '@ocm/wysiwyg/icons';

export function ExportPlugin(opts?: PluginToolbarOpts) {
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
        ...pluginToolbarPlacement({ menu: 'tools', order: 80 }, opts),
        onClick: () => {
          openExport?.();
        },
      });
    },
  });
}
