import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import { definePlugin } from '@codemerge/sdk';
import { HistoryManager } from './services/HistoryManager';
import { HistoryViewerModal } from './components/HistoryViewerModal';
import { historyIcon } from '@codemerge/sdk/icons';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

/**
 * Markdown snapshot timeline + viewer (WYSIWYG).
 * Kernel undo/redo stack and toolbar buttons live on `@codemerge/editor` (not here).
 */
/** Snapshot debounce: `getMarkdown()` serializes the whole doc. */
export const HISTORY_SNAPSHOT_DEBOUNCE_MS = 500;

export function HistoryPlugin() {
  let openHistory: (() => void) | null = null;

  return definePlugin({
    name: 'history',
    hotkeys: [{ keys: 'Mod-Alt-h', command: 'viewHistory', description: 'View history' }],
    commands: {
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
      // Per setup: a re-setup (destroy + new editor) must not inherit old snapshots.
      const historyManager = new HistoryManager();
      historyManager.addState(editor.getMarkdown());

      let timer: ReturnType<typeof setTimeout> | null = null;
      const flush = () => {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
          historyManager.addState(editor.getMarkdown());
        }
      };

      openHistory = () => {
        flush();
        viewer.show(historyManager.getStates(), historyManager.getCurrentIndex(), (md) => {
          editor.setMarkdown(md);
        });
      };

      ctx.on('docChanged', () => {
        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          timer = null;
          historyManager.addState(editor.getMarkdown());
        }, HISTORY_SNAPSHOT_DEBOUNCE_MS);
      });
      ctx.disposable(() => {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        openHistory = null;
      });

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
