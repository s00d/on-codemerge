import './style.scss';

import { definePlugin, withMarkTarget, setMarkAttrs, core } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
import type { Command, EditorState } from '@on-codemerge/kernel';
import { textColorIcon, backgroundColorIcon } from '../../icons';
import { ColorWell } from '../../utils/ColorWell';

function markColorAtSelection(editor: EditorAPI, markType: string): string | null {
  const state = editor.getState();
  const range = core.selectionTextRange(state.selection);
  if (!range) {
    return null;
  }
  let para;
  try {
    para = core.getNodeAt(state.doc, range.path);
  } catch {
    return null;
  }
  const offset = range.from < range.to ? range.from : Math.max(0, range.from - 1);
  let pos = 0;
  for (const child of para.content ?? []) {
    if (child.type !== 'text' || typeof child.text !== 'string') {
      continue;
    }
    const len = child.text.length;
    if (offset >= pos && offset < pos + len) {
      const mark = child.marks?.find((m) => m.type === markType);
      const color = mark?.attrs?.color;
      return typeof color === 'string' ? color : null;
    }
    pos += len;
  }
  return null;
}

function removeMarkType(markType: string): Command {
  return (state: EditorState) => {
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
        markType,
      },
    ];
  };
}

export function ColorPlugin() {
  let openText: (() => void) | null = null;
  let openHighlight: (() => void) | null = null;

  return definePlugin({
    name: 'color',
    marks: [
      { name: 'textColor', attrs: { color: '#000000' } },
      { name: 'highlight', attrs: { color: '#ffff00' } },
    ],
    hotkeys: [
      { keys: 'Mod-Shift-h', command: 'hiliteColor', description: 'Highlight color' },
      { keys: 'Mod-Shift-q', command: 'foreColor', description: 'Text color' },
    ],
    commands: {
      foreColor: () => {
        openText?.();
        return null;
      },
      hiliteColor: () => {
        openHighlight?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      const well = new ColorWell(editor, ctx.scope);

      const applyMark = (markType: 'textColor' | 'highlight', hex: string) => {
        withMarkTarget(editor, () => {
          editor.run(setMarkAttrs(markType, { color: hex }));
        });
      };

      const clearMark = (markType: 'textColor' | 'highlight') => {
        withMarkTarget(editor, () => {
          editor.run(removeMarkType(markType));
        });
      };

      openText = () => {
        well.show({
          title: editor.t('color.text'),
          initial: markColorAtSelection(editor, 'textColor') ?? '#111111',
          onPick: (hex) => {
            applyMark('textColor', hex);
          },
          onClear: () => {
            clearMark('textColor');
          },
        });
      };

      openHighlight = () => {
        well.show({
          title: editor.t('color.background'),
          initial: markColorAtSelection(editor, 'highlight') ?? '#ffe566',
          onPick: (hex) => {
            applyMark('highlight', hex);
          },
          onClear: () => {
            clearMark('highlight');
          },
        });
      };

      ctx.toolbar.add({
        id: 'fore-color',
        icon: textColorIcon,
        title: editor.t('color.text'),
        group: 'format',
        order: 15,
        onClick: () => openText?.(),
      });
      ctx.toolbar.add({
        id: 'hilite-color',
        icon: backgroundColorIcon,
        title: editor.t('color.background'),
        group: 'format',
        order: 16,
        onClick: () => openHighlight?.(),
      });
    },
  });
}
