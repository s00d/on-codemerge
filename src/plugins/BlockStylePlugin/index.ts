import './style.scss';

import type { DocNode } from '@on-codemerge/kernel';
import { definePlugin, setBlockAttr, core } from '@on-codemerge/sdk';
import { styleIcon } from '../../icons';
import { blockStylePanel } from './components/BlockStylePanel';
import { draftToStyleJson, emptyDraft, parseStyleAttr } from './constants';
import type { StyleDraft } from './constants';

function readSelectedBlockStyle(editor: {
  getJSON: () => { doc: DocNode };
  getSelection: () => { anchor: { path: number[] } };
}): StyleDraft {
  const path = editor.getSelection().anchor.path;
  if (path.length === 0) {
    return emptyDraft();
  }
  try {
    const node = core.getNodeAt(editor.getJSON().doc, [path[0]]);
    return parseStyleAttr(node.attrs?.style);
  } catch {
    return emptyDraft();
  }
}

export function BlockStylePlugin() {
  return definePlugin({
    name: 'block-style',
    setup(ctx) {
      const editor = ctx.editor;

      const open = () => {
        const draft = readSelectedBlockStyle(editor);

        ctx.popup.open({
          title: editor.t('blockStyle.blockStyleEditor'),
          className: 'block-style-editor',
          size: 'md',
          // Keep open while picking colors / using selects (no nested popup).
          closeOnClickOutside: true,
          items: [
            {
              type: 'view',
              id: 'bs-panel',
              view: () => blockStylePanel(editor, draft),
            },
          ],
          buttons: [
            {
              label: editor.t('blockStyle.clearStyles'),
              variant: 'secondary',
              onClick: () => {
                editor.run(setBlockAttr('style', ''));
              },
            },
            {
              label: editor.t('common.cancel'),
              variant: 'secondary',
              onClick: () => {},
            },
            {
              label: editor.t('common.apply'),
              variant: 'primary',
              onClick: () => {
                editor.run(setBlockAttr('style', draftToStyleJson(draft)));
              },
            },
          ],
        });
      };

      ctx.toolbar.add({
        id: 'block-style',
        icon: styleIcon,
        title: () => editor.t('blockStyle.title'),
        group: 'format',
        order: 19,
        onClick: open,
      });
    },
  });
}
