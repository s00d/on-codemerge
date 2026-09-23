import './style.scss';

import { definePlugin, withMarkTarget, setMarkAttrs } from '@on-codemerge/sdk';
import { CommentMenu } from './components/CommentMenu';
import { commentIcon } from '../../icons';

export function CommentsPlugin() {
  let openComment: (() => void) | null = null;

  return definePlugin({
    name: 'comments',
    marks: [{ name: 'comment', attrs: { id: '', text: '' } }],
    // Unique vs BlockPlugin insertContainer (Mod-Alt-c)
    hotkeys: [{ keys: 'Mod-Shift-c', command: 'addComment', description: 'Add comment' }],
    commands: {
      addComment: () => {
        openComment?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new CommentMenu(editor, ctx.scope);
      openComment = () => {
        menu.show((content, action) => {
          if (action === 'delete') {
            withMarkTarget(editor, () => {
              editor.run(setMarkAttrs('comment', { id: '', text: '' }));
            });
            return;
          }
          const id = `c_${Date.now()}`;
          withMarkTarget(editor, () => {
            editor.run(setMarkAttrs('comment', { id, text: content }));
          });
        });
      };
      ctx.toolbar.add({
        id: 'comment',
        icon: commentIcon,
        title: editor.t('comments.comment'),
        menu: 'review',
        order: 60,
        onClick: () => openComment?.(),
      });
    },
  });
}
