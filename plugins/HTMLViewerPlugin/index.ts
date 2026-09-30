import './style.scss';

import { definePlugin, pluginToolbarPlacement } from '@codemerge/sdk';
import type { PluginToolbarOpts } from '@codemerge/sdk';
import { HTMLViewerModal } from './components/HTMLViewerModal';
import { htmlIcon } from '@ocm/wysiwyg/icons';

export function HTMLViewerPlugin(opts?: PluginToolbarOpts) {
  return definePlugin({
    name: 'html-viewer',
    setup(ctx) {
      const editor = ctx.editor;
      const modal = new HTMLViewerModal(editor, ctx.scope);
      ctx.toolbar.add({
        id: 'html-viewer',
        icon: htmlIcon,
        title: () => editor.t('common.html'),
        ...pluginToolbarPlacement({ menu: 'tools', order: 71 }, opts),
        onClick: () => {
          modal.show(editor.getPublishedHTML());
        },
      });
    },
  });
}
