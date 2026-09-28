import type { ToolbarMenuDef } from '@on-codemerge/sdk';
import commentIcon from './icons/comment.svg';
import insertIcon from './icons/insert.svg';
import shortcutsIcon from './icons/shortcuts.svg';

/** Default WYSIWYG overflow menus: Insert / Review / Tools. */
export function defaultWysiwygToolbarMenus(t: (key: string) => string): ToolbarMenuDef[] {
  return [
    {
      id: 'insert',
      label: () => t('common.insert'),
      title: () => t('common.insert'),
      icon: insertIcon,
      group: 'insert',
      order: 40,
    },
    {
      id: 'review',
      label: () => t('common.review'),
      title: () => t('common.review'),
      icon: commentIcon,
      group: 'review',
      order: 50,
    },
    {
      id: 'tools',
      label: () => t('common.tools'),
      title: () => t('common.tools'),
      icon: shortcutsIcon,
      group: 'tools',
      order: 60,
    },
  ];
}
