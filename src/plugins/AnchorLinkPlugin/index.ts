import './style.scss';

import { definePlugin, setBlockAttr } from '@on-codemerge/sdk';
import { anchorAddIcon } from '../../icons';

export function AnchorLinkPlugin() {
  return definePlugin({
    name: 'anchor-link',
    commands: {
      setAnchor: setBlockAttr('id', 'anchor'),
    },
    setup(ctx) {
      const editor = ctx.editor;
      const popups = ctx.popup.session();

      const open = () => {
        popups.open({
          title: editor.t('common.insertAnchor'),
          className: 'anchor-popup',
          items: [
            {
              type: 'input',
              id: 'anchor-id',
              label: editor.t('common.anchorId'),
              value: '',
            },
            {
              type: 'input',
              id: 'anchor-text',
              label: editor.t('common.text'),
              value: '',
            },
          ],
          buttons: [
            {
              label: editor.t('common.cancel'),
              variant: 'secondary',
              onClick: () => {},
            },
            {
              label: editor.t('common.insert'),
              variant: 'primary',
              onClick: (values) => {
                let id = String(values['anchor-id'] ?? '').trim();
                const text = String(values['anchor-text'] ?? '').trim();
                if (!id) {
                  id = (text || 'section')
                    .toLowerCase()
                    .replaceAll(/[^a-z0-9]+/g, '-')
                    .replaceAll(/^-|-$/g, '');
                }
                editor.run(setBlockAttr('id', id));
                if (text) {
                  editor.notify(`${editor.t('common.anchorSet')}: #${id}`);
                }
              },
            },
          ],
        });
      };

      ctx.toolbar.add({
        id: 'anchor',
        icon: anchorAddIcon,
        title: () => editor.t('common.insertAnchor'),
        menu: 'insert',
        order: 64,
        onClick: open,
      });
    },
  });
}
