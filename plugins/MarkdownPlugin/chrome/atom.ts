import { insertAtomAfter, pluginToolbarPlacement } from '@codemerge/sdk';
import type { PluginContext, PluginToolbarOpts } from '@codemerge/sdk';

import { markdownIcon } from '@codemerge/sdk/icons';

const DEFAULT_TEXT = '# Markdown\n\nHello **world**.\n';

export type AtomChromeHandle = {
  openInsert: () => void;
};

/** Toolbar Insert → Markdown — inserts `md_embed` atom. */
export function setupAtomChrome(ctx: PluginContext, opts?: PluginToolbarOpts): AtomChromeHandle {
  const editor = ctx.editor;

  const openInsert = (): void => {
    editor.run(insertAtomAfter('md_embed', { text: DEFAULT_TEXT }));
  };

  ctx.toolbar.add({
    id: 'md-embed',
    icon: markdownIcon,
    title: () => editor.t('markdown.insert'),
    ...pluginToolbarPlacement({ menu: 'insert', order: 49 }, opts),
    onClick: () => openInsert(),
  });

  return { openInsert };
}
