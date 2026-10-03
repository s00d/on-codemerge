import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import { definePlugin, convertBlockType, insertAtomAfter } from '@codemerge/sdk';
import { TypographyMenu } from './components/TypographyMenu';
import { applyTypographyStyle } from './applyStyle';
import { typographyIcon } from '@ocm/wysiwyg/icons';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

export function TypographyPlugin() {
  let openTypography: (() => void) | null = null;

  return definePlugin({
    name: 'typography',
    nodes: [
      { name: 'heading', group: 'block', attrs: { level: 1 } },
      { name: 'blockquote', group: 'block' },
      { name: 'code_block_typo', group: 'block' },
      { name: 'horizontalRule', group: 'atom', atom: true },
    ],
    hotkeys: [{ keys: 'Mod-Shift-w', command: 'typographyMenu', description: 'Typography styles' }],
    commands: {
      typographyMenu: () => {
        openTypography?.();
        return null;
      },
      setParagraph: convertBlockType('paragraph'),
      setHeading1: convertBlockType('heading', { level: 1 }),
      setHeading2: convertBlockType('heading', { level: 2 }),
      setHeading3: convertBlockType('heading', { level: 3 }),
      setHeading4: convertBlockType('heading', { level: 4 }),
      setBlockquote: convertBlockType('blockquote'),
      insertHr: insertAtomAfter('horizontalRule'),
    },
    setup(ctx) {
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      const editor = ctx.editor;
      const menu = new TypographyMenu(editor, ctx.scope);

      openTypography = () => {
        menu.show((style) => {
          applyTypographyStyle(editor, style);
        });
      };

      ctx.toolbar.add({
        id: 'typography',
        icon: typographyIcon,
        title: () => editor.t('typography.title'),
        group: 'format',
        order: 18,
        onClick: () => {
          openTypography?.();
        },
      });
    },
  });
}
