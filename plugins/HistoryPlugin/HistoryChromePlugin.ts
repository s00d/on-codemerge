import './style.scss';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import { definePlugin } from '@codemerge/sdk';
import { registerHistoryChrome } from './chrome';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

/**
 * Slim history chrome: undo/redo toolbar only.
 * Hotkeys are seeded by the editor platform (`KERNEL_UNDO_REDO_HOTKEYS`).
 * Compose in MD/JSON `createDefaultPlugins` — do not pull HistoryManager snapshots.
 */
export function HistoryChromePlugin() {
  return definePlugin({
    name: 'history-chrome',
    setup(ctx) {
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      registerHistoryChrome(ctx);
    },
  });
}
