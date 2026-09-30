import './style.scss';

import { definePlugin, pluginToolbarPlacement } from '@codemerge/sdk';
import type { DisposableScope, EditorAPI, PluginToolbarOpts } from '@codemerge/sdk';
import { ShortcutsMenu } from './components/ShortcutsMenu';
import { shortcutsIcon } from '@ocm/wysiwyg/icons';

/**
 * Shared opener for hosts that register their own toolbar/hotkey (e.g. Json workspace).
 * Do not also mount ShortcutsPlugin() in the same stack or you get two shortcuts buttons.
 */
export function bindShortcutsPopup(
  editor: EditorAPI,
  scope: DisposableScope,
  openRef: { current: (() => void) | null }
): void {
  const menu = new ShortcutsMenu(editor, scope);
  openRef.current = () => {
    menu.show();
  };
}

export function ShortcutsPlugin(opts?: PluginToolbarOpts) {
  return definePlugin({
    name: 'shortcuts',
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new ShortcutsMenu(editor, ctx.scope);
      ctx.toolbar.add({
        id: 'shortcuts',
        icon: shortcutsIcon,
        title: () => editor.t('shortcuts.title'),
        ...pluginToolbarPlacement({ menu: 'tools', order: 99 }, opts),
        onClick: () => {
          menu.show();
        },
      });
    },
  });
}
