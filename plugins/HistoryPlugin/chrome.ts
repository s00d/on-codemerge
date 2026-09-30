import { applyToolbarConfig, historyToolbarItems } from '@codemerge/sdk';
import type { PluginContext } from '@codemerge/sdk';
import { redoIcon, undoIcon } from '@ocm/wysiwyg/icons';

/** Kernel undo/redo toolbar chrome (shared by HistoryPlugin + slim MD/JSON apps). */
export function registerHistoryChrome(ctx: PluginContext): void {
  const editor = ctx.editor;
  applyToolbarConfig(
    ctx,
    {
      items: historyToolbarItems(
        { undo: undoIcon, redo: redoIcon },
        {
          undo: () => editor.t('history.undo'),
          redo: () => editor.t('history.redo'),
        }
      ),
    },
    () => ({ editor })
  );
}
