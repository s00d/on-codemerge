import './style.scss';

import { definePlugin } from '@codemerge/sdk';
import { registerHistoryChrome } from './chrome';

/**
 * Slim history chrome: undo/redo toolbar only.
 * Hotkeys are seeded by the editor platform (`KERNEL_UNDO_REDO_HOTKEYS`).
 * Compose in MD/JSON `createDefaultPlugins` — do not pull HistoryManager snapshots.
 */
export function HistoryChromePlugin() {
  return definePlugin({
    name: 'history-chrome',
    setup(ctx) {
      registerHistoryChrome(ctx);
    },
  });
}
