import './style.scss';
import { asAttr } from '../../utils/asAttr';

import { definePlugin, withMarkTarget, setMarkAttrs, h } from '@on-codemerge/sdk';
import type { ViewSpec } from '@on-codemerge/sdk';
import { FootnoteMenu } from './components/FootnoteMenu';
import { footnoteIcon } from '../../icons';

function optionalStringProp(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(value, key);
  return typeof desc?.value === 'string' ? desc.value : undefined;
}

function footnoteItemsFromJson(raw: unknown): { id?: string; note?: string }[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const items: { id?: string; note?: string }[] = [];
  for (const entry of raw) {
    items.push({
      id: optionalStringProp(entry, 'id'),
      note: optionalStringProp(entry, 'note'),
    });
  }
  return items;
}

export function FootnotesPlugin() {
  let openFootnote: (() => void) | null = null;

  return definePlugin({
    name: 'footnotes',
    marks: [{ name: 'footnote', attrs: { id: '', note: '' } }],
    nodes: [
      {
        name: 'footnote_list',
        group: 'atom',
        atom: true,
        attrs: { items: '[]' },
      },
    ],
    // Unique vs FormBuilder (Mod-Alt-f)
    hotkeys: [{ keys: 'Mod-Alt-j', command: 'addFootnote', description: 'Add footnote' }],
    commands: {
      addFootnote: () => {
        openFootnote?.();
        return null;
      },
    },
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new FootnoteMenu(editor, ctx.scope);
      openFootnote = () => {
        menu.show((content) => {
          const id = `fn_${Date.now()}`;
          withMarkTarget(editor, () => {
            editor.run(setMarkAttrs('footnote', { id, note: content }));
          });
        });
      };
      ctx.toolbar.add({
        id: 'footnotes',
        icon: footnoteIcon,
        title: () => editor.t('common.footnote'),
        menu: 'review',
        order: 62,
        onClick: () => openFootnote?.(),
      });
    },
    widgets: {
      footnote_list: {
        render(attrs): ViewSpec {
          let items: { id?: string; note?: string }[] = [];
          try {
            const parsed: unknown = JSON.parse(asAttr(attrs.items, '[]'));
            items = footnoteItemsFromJson(parsed);
          } catch {
            items = [];
          }
          if (items.length === 0) {
            return h('div', { class: 'ocm-footnotes is-empty' }, 'Footnotes');
          }
          return h(
            'div',
            { class: 'ocm-footnotes' },
            ...items.map((item, i) =>
              h(
                'div',
                { class: 'ocm-footnote-item', attrs: { 'data-footnote': String(item.id ?? i) } },
                `${i + 1}. ${item.note ?? ''}`
              )
            )
          );
        },
      },
    },
  });
}
