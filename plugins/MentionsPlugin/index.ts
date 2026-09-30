import './style.scss';

import { definePlugin, withMarkTarget, setMarkAttrs, pluginToolbarPlacement } from '@codemerge/sdk';
import type { PluginToolbarOpts } from '@codemerge/sdk';
import { MentionsMenu } from './components/MentionsMenu';
import type { Mention } from './components/MentionsMenu';
import { mentionsIcon } from '@ocm/wysiwyg/icons';

const DEFAULT_MENTIONS: Mention[] = [
  { id: '1', label: 'Alice' },
  { id: '2', label: 'Bob' },
  { id: '3', label: 'Carol' },
];

export function MentionsPlugin(mentions: Mention[] = DEFAULT_MENTIONS, opts?: PluginToolbarOpts) {
  let openMentions: (() => void) | null = null;

  return definePlugin({
    name: 'mentions',
    marks: [{ name: 'mention', attrs: { id: '', label: '' } }],
    // Unique vs MathPlugin (Mod-Shift-m)
    hotkeys: [{ keys: 'Mod-Shift-2', command: 'insertMention', description: 'Insert mention' }],
    commands: {
      insertMention: () => {
        openMentions?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new MentionsMenu(editor, mentions, ctx.scope);
      openMentions = () => {
        menu.show((m) => {
          withMarkTarget(editor, () => {
            editor.run(setMarkAttrs('mention', { id: m.id, label: m.label }));
          });
        });
      };
      ctx.toolbar.add({
        id: 'mentions',
        icon: mentionsIcon,
        title: () => editor.t('common.mentions'),
        ...pluginToolbarPlacement({ menu: 'review', order: 61 }, opts),
        onClick: () => openMentions?.(),
      });
    },
  });
}
