import './style.scss';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import { definePlugin } from '@codemerge/sdk';
import { HistoryManager } from './services/HistoryManager';
import { HistoryViewerModal } from './components/HistoryViewerModal';
import { historyIcon } from '@ocm/wysiwyg/icons';
import { registerHistoryChrome } from './chrome';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

export { HistoryChromePlugin } from './HistoryChromePlugin';

export function HistoryPlugin() {
  const historyManager = new HistoryManager();
  let openHistory: (() => void) | null = null;

  return definePlugin({
    name: 'history',
    hotkeys: [{ keys: 'Mod-Alt-h', command: 'viewHistory', description: 'View history' }],
    commands: {
      undo: () => null,
      redo: () => null,
      viewHistory: () => {
        openHistory?.();
        return null;
      },
    },
    setup(ctx) {
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      const editor = ctx.editor;
      const viewer = new HistoryViewerModal(editor, ctx.scope);
      historyManager.addState(editor.getMarkdown());

      openHistory = () => {
        viewer.show(historyManager.getStates(), historyManager.getCurrentIndex(), (md) => {
          editor.setMarkdown(md);
        });
      };

      ctx.on('docChanged', () => {
        historyManager.addState(editor.getMarkdown());
      });

      registerHistoryChrome(ctx);
      ctx.toolbar.add({
        id: 'history',
        icon: historyIcon,
        title: () => editor.t('history.history'),
        group: 'history',
        order: 3,
        onClick: () => {
          openHistory?.();
        },
      });
    },
  });
}
