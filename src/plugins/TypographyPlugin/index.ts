import './style.scss';

import { definePlugin, convertBlockType, insertAtomAfter, core } from '@on-codemerge/sdk';
import { plainText } from '@on-codemerge/kernel';
import { TypographyMenu } from './components/TypographyMenu';
import { typographyIcon } from '../../icons';

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
      const editor = ctx.editor;
      const menu = new TypographyMenu(editor, ctx.scope);

      openTypography = () => {
        menu.show((style) => {
          switch (style) {
            case 'clear': {
              editor.run(convertBlockType('paragraph'));
              break;
            }
            case 'h1': {
              editor.command('setHeading1');
              break;
            }
            case 'h2': {
              editor.command('setHeading2');
              break;
            }
            case 'h3': {
              editor.command('setHeading3');
              break;
            }
            case 'h4': {
              editor.command('setHeading4');
              break;
            }
            case 'paragraph': {
              editor.command('setParagraph');
              break;
            }
            case 'blockquote': {
              editor.command('setBlockquote');
              break;
            }
            case 'hr': {
              editor.command('insertHr');
              break;
            }
            case 'pre': {
              editor.run((state) => {
                const idx = state.selection.anchor.path[0] ?? 0;
                let block;
                try {
                  block = core.getNodeAt(state.doc, [idx]);
                } catch {
                  return null;
                }
                const code = plainText(block);
                return convertBlockType('code_block', {
                  language: 'plaintext',
                  code,
                })(state);
              });
              break;
            }
            default: {
              break;
            }
          }
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
