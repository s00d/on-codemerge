import './style.scss';

import { definePlugin } from '@on-codemerge/sdk';
import type { Mark } from '@on-codemerge/kernel';
import { trackChangesIcon } from '../../icons';

/**
 * Live track-changes: when enabled, typed text gets an `insertion` mark and
 * backspace soft-deletes via a `deletion` mark (InputBridge storedMarks path).
 */
export function TrackChangesPlugin() {
  return definePlugin({
    name: 'track-changes',
    marks: [
      { name: 'insertion', attrs: { author: '' } },
      { name: 'deletion', attrs: { author: '' } },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      let enabled = false;
      const author = 'local';

      const insertionMark = (): Mark => ({ type: 'insertion', attrs: { author } });
      const deletionMark = (): Mark => ({ type: 'deletion', attrs: { author } });

      const applyMode = (on: boolean) => {
        enabled = on;
        if (on) {
          editor.setStoredMarks([insertionMark()]);
          editor.setSoftDeleteMark(deletionMark());
        } else {
          editor.setStoredMarks([]);
          editor.setSoftDeleteMark(null);
        }
        editor.toolbar.refresh();
      };

      ctx.toolbar.add({
        id: 'track-changes',
        icon: trackChangesIcon,
        title: () => editor.t('common.trackChanges'),
        menu: 'review',
        order: 63,
        active: () => enabled,
        onClick: () => {
          applyMode(!enabled);
          editor.notify(
            enabled ? editor.t('common.trackChangesOn') : editor.t('common.trackChangesOff')
          );
        },
      });

      ctx.scope.disposable(() => {
        if (enabled) {
          applyMode(false);
        }
      });
    },
  });
}
