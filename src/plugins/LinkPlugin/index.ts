import './style.scss';

import { definePlugin, withMarkTarget, setMarkAttrs, core } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
import type { Command } from '@on-codemerge/kernel';
import { LinkMenu } from './components/LinkMenu';
import type { LinkData } from './components/LinkMenu';
import { linkIcon, editIcon, deleteIcon } from '../../icons';

function applyLink(editor: EditorAPI, data: LinkData): void {
  withMarkTarget(editor, () => {
    editor.run(
      setMarkAttrs('link', {
        href: data.url,
        title: data.title,
        rel: data.nofollow ? 'nofollow' : '',
        target: data.targetBlank ? '_blank' : '',
        anchor: data.anchor,
      })
    );
  });
}

function removeLinkMark(): Command {
  return (state) => {
    const range = core.selectionTextRange(state.selection);
    if (!range || range.from === range.to) {
      return null;
    }
    return [
      {
        type: 'remove_mark',
        path: range.path,
        from: range.from,
        to: range.to,
        markType: 'link',
      },
    ];
  };
}

export function LinkPlugin() {
  let openLink: (() => void) | null = null;

  return definePlugin({
    name: 'link',
    marks: [
      {
        name: 'link',
        attrs: { href: '', title: '', rel: '', target: '', anchor: '' },
      },
    ],
    hotkeys: [{ keys: 'Mod-k', command: 'insertLink', description: 'Insert link' }],
    commands: {
      insertLink: () => {
        openLink?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      const t = (k: string) => editor.t(k) || k;
      const menu = new LinkMenu(editor, ctx.scope);
      openLink = () => {
        menu.show((data) => {
          applyLink(editor, data);
        });
      };

      ctx.toolbar.add({
        id: 'link',
        icon: linkIcon,
        title: editor.t('link.insert'),
        group: 'format',
        order: 17,
        onClick: () => {
          openLink?.();
        },
      });

      ctx.onDom('host', 'contextmenu', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const a = target.closest('a');
        if (!(a instanceof HTMLAnchorElement)) {
          return;
        }
        e.preventDefault();
        ctx.menu.open(
          [
            {
              label: t('common.edit'),
              icon: editIcon,
              onClick: () => {
                menu.show(
                  (data) => {
                    applyLink(editor, data);
                  },
                  {
                    url: a.href,
                    anchor: a.textContent || '',
                    title: a.title || '',
                    nofollow: (a.rel || '').includes('nofollow'),
                    targetBlank: a.target === '_blank',
                  }
                );
              },
            },
            { type: 'divider' },
            {
              label: t('common.delete'),
              icon: deleteIcon,
              variant: 'danger',
              onClick: () => {
                withMarkTarget(editor, () => {
                  editor.run(removeLinkMark());
                });
              },
            },
          ],
          e.clientX,
          e.clientY
        );
      });
    },
  });
}
