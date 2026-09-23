import './style.scss';

import { definePlugin, wrapInList } from '@on-codemerge/sdk';
import { listBulletIcon, listNumberedIcon } from '../../icons';

export function ListsPlugin() {
  return definePlugin({
    name: 'lists',
    nodes: [
      { name: 'bulletList', group: 'block' },
      { name: 'orderedList', group: 'block' },
      { name: 'listItem', group: 'block' },
    ],
    commands: {
      wrapBulletList: wrapInList('bulletList'),
      wrapOrderedList: wrapInList('orderedList'),
    },
    hotkeys: [
      { keys: 'Mod-Shift-8', command: 'wrapBulletList', description: 'Bulleted list' },
      { keys: 'Mod-Shift-7', command: 'wrapOrderedList', description: 'Numbered list' },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      ctx.toolbar.add({
        id: 'list-bullet',
        icon: listBulletIcon,
        title: () => editor.t('lists.bullet'),
        group: 'format',
        order: 20,
        onClick: () => editor.command('wrapBulletList'),
      });
      ctx.toolbar.add({
        id: 'list-ordered',
        icon: listNumberedIcon,
        title: () => editor.t('lists.numbered'),
        group: 'format',
        order: 21,
        onClick: () => editor.command('wrapOrderedList'),
      });
    },
  });
}
