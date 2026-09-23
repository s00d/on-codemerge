import './style.scss';

import { definePlugin } from '@on-codemerge/sdk';
import { LanguageManager } from './services/LanguageManager';
import { LanguageMenu } from './components/LanguageMenu';
import { globeIcon } from '../../icons';

export function LanguagePlugin() {
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
        menu: 'tools',
        order: 85,
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
