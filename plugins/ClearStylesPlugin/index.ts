import { clearStyles, definePlugin } from '@codemerge/sdk';
import { clearIcon } from '@codemerge/sdk/icons';

/**
 * Clear visual styles (marks + block style/align/lineHeight).
 * Collapsed caret → whole document; non-empty selection → selection only.
 */
export function ClearStylesPlugin() {
  return definePlugin({
    name: 'clear-styles',
    commands: {
      clearStyles: clearStyles(),
    },
    hotkeys: [
      {
        keys: 'Mod-\\',
        command: 'clearStyles',
        description: 'Clear styles',
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      ctx.toolbar.add({
        id: 'clear-styles',
        icon: clearIcon,
        title: () => editor.t('clearStyles.title'),
        group: 'marks',
        order: 8,
        onClick: () => {
          if (!editor.command('clearStyles')) {
            editor.notify(editor.t('clearStyles.nothingToClear'));
          }
        },
      });
    },
  });
}
