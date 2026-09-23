import './style.scss';

import { definePlugin, withMarkTarget, setMarkAttrs, setBlockAttr, core } from '@on-codemerge/sdk';
import type { EditorAPI } from '@on-codemerge/sdk';
import { fontSizeIcon } from '../../icons';
import { defaultDraft } from './constants';
import type { FontDraft } from './constants';
import { fontSettingsPanel } from './components/FontSettingsPanel';

function markAttrAtSelection(editor: EditorAPI, markType: string, attr: string): string | null {
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
      const v = mark?.attrs?.[attr];
      return typeof v === 'string' && v ? v : null;
    }
    pos += len;
  }
  return null;
}

function blockLineHeight(editor: EditorAPI): string | null {
  const path = editor.getSelection().anchor.path;
  if (path.length === 0) {
    return null;
  }
  try {
    const node = core.getNodeAt(editor.getJSON().doc, [path[0]]);
    const lh = node.attrs?.lineHeight;
    return typeof lh === 'string' && lh ? lh : null;
  } catch {
    return null;
  }
}

function readDraft(editor: EditorAPI): FontDraft {
  const draft = defaultDraft();
  const family = markAttrAtSelection(editor, 'fontFamily', 'family');
  const size = markAttrAtSelection(editor, 'fontSize', 'size');
  const lh = blockLineHeight(editor);
  if (family) {
    draft.family = family;
  }
  if (size) {
    draft.size = size;
  }
  if (lh) {
    draft.lineHeight = lh;
  }
  return draft;
}

/**
 * Font family / size / line-height UI. Mark toggles (B/I/U/S) live in ToolbarPlugin —
 * do not re-register the same toolbar ids.
 */
export function FontPlugin() {
  return definePlugin({
    name: 'font',
    marks: [
      { name: 'fontFamily', attrs: { family: 'Arial, Helvetica, sans-serif' } },
      { name: 'fontSize', attrs: { size: '16px' } },
    ],
    commands: {
      toggleBold: core.toggleMark('bold'),
      toggleItalic: core.toggleMark('italic'),
      toggleUnderline: core.toggleMark('underline'),
      toggleStrike: core.toggleMark('strike'),
    },
    hotkeys: [
      { keys: 'Mod-b', command: 'toggleBold', description: 'Bold' },
      { keys: 'Mod-i', command: 'toggleItalic', description: 'Italic' },
      { keys: 'Mod-u', command: 'toggleUnderline', description: 'Underline' },
      { keys: 'Mod-Shift-x', command: 'toggleStrike', description: 'Strikethrough' },
    ],
    setup(ctx) {
      const editor = ctx.editor;

      ctx.toolbar.add({
        id: 'font-settings',
        icon: fontSizeIcon,
        title: () => editor.t('font.settings'),
        group: 'format',
        order: 14,
        onClick: () => {
          const draft = readDraft(editor);
          ctx.popup.open({
            title: editor.t('font.settings'),
            className: 'font-settings-modal',
            size: 'md',
            closeOnClickOutside: true,
            items: [
              {
                type: 'view',
                id: 'font-panel',
                view: () => fontSettingsPanel(editor, draft),
              },
            ],
            buttons: [
              {
                label: editor.t('common.cancel'),
                variant: 'secondary',
                onClick: () => {},
              },
              {
                label: editor.t('common.apply'),
                variant: 'primary',
                onClick: () => {
                  withMarkTarget(editor, () => {
                    editor.run(setMarkAttrs('fontFamily', { family: draft.family }));
                    editor.run(setMarkAttrs('fontSize', { size: draft.size }));
                  });
                  editor.run(setBlockAttr('lineHeight', draft.lineHeight));
                },
              },
            ],
          });
        },
      });
    },
  });
}
