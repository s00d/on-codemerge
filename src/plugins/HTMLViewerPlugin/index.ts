import './style.scss';

import { definePlugin } from '@on-codemerge/sdk';
import { HTMLViewerModal } from './components/HTMLViewerModal';
import { htmlIcon } from '../../icons';

export function HTMLViewerPlugin() {
  return definePlugin({
    name: 'html-viewer',
    setup(ctx) {
      const editor = ctx.editor;
      const modal = new HTMLViewerModal(editor, ctx.scope);
      ctx.toolbar.add({
        id: 'html-viewer',
        icon: htmlIcon,
        title: () => editor.t('common.html'),
        menu: 'tools',
        order: 71,
        onClick: () => {
          modal.show(editor.getPublishedHTML());
        },
      });
    },
  });
}
