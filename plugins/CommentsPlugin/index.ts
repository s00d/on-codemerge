import {
  definePlugin,
  withMarkTarget,
  setMarkAttrs,
  pluginToolbarPlacement,
  core,
} from '@codemerge/sdk';
import type { PluginToolbarOpts } from '@codemerge/sdk';
import type { EditorState } from '@codemerge/kernel';

import { CommentMenu } from './components/CommentMenu';
import { commentIcon } from '@codemerge/sdk/icons';

type CommentHit = { path: number[]; from: number; to: number; id: string; text: string };

/** Comment mark under the caret/selection start, expanded over adjacent runs with the same id. */
export function findComment(state: EditorState): CommentHit | null {
  const range = core.selectionTextRange(state.selection);
  if (range === null) {
    return null;
  }
  const runs: { from: number; to: number; id: string; text: string }[] = [];
  let at = 0;
  for (const child of core.getNodeAt(state.doc, range.path).content ?? []) {
    if (child.type !== 'text') {
      continue;
    }
    const len = (child.text ?? '').length;
    const attrs = child.marks?.find((m) => m.type === 'comment')?.attrs ?? {};
    const id = typeof attrs['id'] === 'string' ? attrs['id'] : '';
    const text = typeof attrs['text'] === 'string' ? attrs['text'] : '';
    runs.push({ from: at, to: at + len, id, text });
    at += len;
  }
  const probe = range.from === range.to && range.from > 0 ? range.from - 1 : range.from;
  let i = runs.findIndex((r) => probe >= r.from && probe < r.to);
  const hit = runs[i];
  if (hit === undefined || (hit.id === '' && hit.text === '')) {
    return null;
  }
  const same = (r: (typeof runs)[number] | undefined) =>
    r !== undefined && r.id === hit.id && r.text === hit.text;
  let j = i;
  while (same(runs[i - 1])) {
    i--;
  }
  while (same(runs[j + 1])) {
    j++;
  }
  return {
    path: range.path,
    from: runs[i]?.from ?? hit.from,
    to: runs[j]?.to ?? hit.to,
    id: hit.id,
    text: hit.text,
  };
}

export function CommentsPlugin(opts?: PluginToolbarOpts) {
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
        const existing = findComment(editor.getState());
        menu.show(
          (content, action) => {
            if (existing) {
              const { path, from, to } = existing;
              editor.run(() =>
                action === 'delete'
                  ? [{ type: 'remove_mark', path, from, to, markType: 'comment' }]
                  : [
                      {
                        type: 'set_mark',
                        path,
                        from,
                        to,
                        mark: { type: 'comment', attrs: { id: existing.id, text: content } },
                      },
                    ]
              );
              return;
            }
            const id = `c_${Date.now()}`;
            withMarkTarget(editor, () => {
              editor.run(setMarkAttrs('comment', { id, text: content }));
            });
          },
          existing?.text ?? '',
          existing !== null
        );
      };
      ctx.toolbar.add({
        id: 'comment',
        icon: commentIcon,
        title: () => editor.t('comments.comment'),
        ...pluginToolbarPlacement({ menu: 'review', order: 60 }, opts),
        onClick: () => openComment?.(),
      });
    },
  });
}
