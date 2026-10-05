import { insertAtomAfter, pluginToolbarPlacement } from '@codemerge/sdk';
import type { PluginContext, PluginToolbarOpts } from '@codemerge/sdk';

import { bracesIcon } from '@codemerge/sdk/icons';

const DEFAULT_TEXT = '{\n  "key": "value"\n}\n';

export type AtomChromeHandle = {
  openInsert: () => void;
};

/** Toolbar Insert → JSON — inserts `json_embed` atom with inline Tree/Raw workspace. */
export function setupAtomChrome(ctx: PluginContext, opts?: PluginToolbarOpts): AtomChromeHandle {
  const editor = ctx.editor;

  const openInsert = (): void => {
    editor.run(insertAtomAfter('json_embed', { text: DEFAULT_TEXT }));
  };

  ctx.toolbar.add({
    id: 'json-embed',
    icon: bracesIcon,
    title: () => editor.t('json.insert'),
    ...pluginToolbarPlacement({ menu: 'insert', order: 48 }, opts),
    onClick: () => openInsert(),
  });

  return { openInsert };
}
