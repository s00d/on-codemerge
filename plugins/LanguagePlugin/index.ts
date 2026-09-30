import './style.scss';

import { definePlugin, pluginToolbarPlacement } from '@codemerge/sdk';
import type { PluginToolbarOpts } from '@codemerge/sdk';
import { LanguageManager } from './services/LanguageManager';
import { LanguageMenu } from './components/LanguageMenu';
import { globeIcon } from '@ocm/wysiwyg/icons';

export function LanguagePlugin(opts?: PluginToolbarOpts) {
  const manager = new LanguageManager();

  return definePlugin({
    name: 'language',
    setup(ctx) {
      const editor = ctx.editor;
      manager.initialize(editor);
      void manager.restoreSavedLocale();
      const menu = new LanguageMenu(editor, manager, ctx.scope);
      ctx.toolbar.add({
        id: 'language',
        icon: globeIcon,
        title: () => editor.t('common.language'),
        ...pluginToolbarPlacement({ menu: 'tools', order: 85 }, opts),
        onClick: () => {
          menu.show();
        },
      });
      ctx.scope.disposable(
        editor.onLocaleChange(() => {
          editor.toolbar.refresh();
        })
      );
    },
  });
}
