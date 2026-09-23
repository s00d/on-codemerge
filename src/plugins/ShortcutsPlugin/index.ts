import './style.scss';

import { definePlugin } from '@on-codemerge/sdk';
import { ShortcutsMenu } from './components/ShortcutsMenu';
import { shortcutsIcon } from '../../icons';

export function ShortcutsPlugin() {
  return definePlugin({
    name: 'shortcuts',
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new ShortcutsMenu(editor, ctx.scope);
      ctx.toolbar.add({
        id: 'shortcuts',
        icon: shortcutsIcon,
        title: () => editor.t('shortcuts.title'),
        menu: 'tools',
        order: 99,
        onClick: () => {
          menu.show();
        },
      });
    },
  });
}
