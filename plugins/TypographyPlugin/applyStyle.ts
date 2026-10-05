import { convertBlockType, core } from '@codemerge/sdk';
import type { EditorAPI } from '@codemerge/sdk';

import { plainText } from '@codemerge/kernel';

/** Apply typography style id (from TypographyMenu) to the editor. */
export function applyTypographyStyle(editor: EditorAPI, style: string): void {
  const actions: Record<string, () => void> = {
    clear: () => {
      editor.run(convertBlockType('paragraph'));
    },
    h1: () => {
      editor.command('setHeading1');
    },
    h2: () => {
      editor.command('setHeading2');
    },
    h3: () => {
      editor.command('setHeading3');
    },
    h4: () => {
      editor.command('setHeading4');
    },
    paragraph: () => {
      editor.command('setParagraph');
    },
    blockquote: () => {
      editor.command('setBlockquote');
    },
    hr: () => {
      editor.command('insertHr');
    },
    pre: () => {
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
    },
  };
  actions[style]?.();
}
