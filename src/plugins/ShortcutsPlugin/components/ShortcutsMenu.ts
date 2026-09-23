import { PopupController, foreign, h, mount } from '@on-codemerge/sdk';
import type { DisposableScope, EditorAPI, ViewSpec } from '@on-codemerge/sdk';

type ShortcutRow = { keys: string; description: string; category: string };

function formatShortcut(keys: string): string {
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  return keys
    .split(/[-+]/)
    .map((part) => {
      const p = part.trim();
      const lower = p.toLowerCase();
      if (lower === 'mod' || lower === 'cmd' || lower === 'meta') {
        return isMac ? '⌘' : 'Ctrl';
      }
      if (lower === 'ctrl' || lower === 'control') {
        return isMac ? '⌃' : 'Ctrl';
      }
      if (lower === 'shift') {
        return '⇧';
      }
      if (lower === 'alt' || lower === 'option') {
        return isMac ? '⌥' : 'Alt';
      }
      if (lower === 'enter' || lower === 'return') {
        return '↵';
      }
      if (lower === 'backspace') {
        return '⌫';
      }
      if (lower === 'delete') {
        return '⌦';
      }
      if (lower === 'escape' || lower === 'esc') {
        return '⎋';
      }
      if (lower === 'arrowup') {
        return '↑';
      }
      if (lower === 'arrowdown') {
        return '↓';
      }
      if (lower === 'arrowleft') {
        return '←';
      }
      if (lower === 'arrowright') {
        return '→';
      }
      return p.length === 1 ? p.toUpperCase() : p;
    })
    .join('');
}

function categoryLabel(raw: string, t: (k: string) => string): string {
  if (raw === 'Editing') {
    return t('Editing') || 'Editing';
  }
  return raw
    .replace(/Plugin$/i, '')
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export class ShortcutsMenu {
  private readonly editor: EditorAPI;
  private readonly popups: PopupController;

  constructor(editor: EditorAPI, scope: DisposableScope) {
    this.editor = editor;
    this.popups = new PopupController((o) => editor.ui.popup.open(o), scope);
  }

  private groupRows(filter: string): Record<string, ShortcutRow[]> {
    const term = filter.toLowerCase().trim();
    const rows = this.editor.listShortcuts();
    const groups: Record<string, ShortcutRow[]> = {};
    for (const row of rows) {
      if (
        term &&
        !row.description.toLowerCase().includes(term) &&
        !row.keys.toLowerCase().includes(term) &&
        !row.category.toLowerCase().includes(term)
      ) {
        continue;
      }
      const cat = categoryLabel(row.category, (k) => this.editor.t(k));
      (groups[cat] ??= []).push(row);
    }
    return groups;
  }

  private listSpec(filter: string): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    const entries = Object.entries(this.groupRows(filter));
    if (entries.length === 0) {
      return h('div', { class: 'shortcuts-empty' }, t('No shortcuts found'));
    }
    return h(
      'div',
      { class: 'shortcuts-grid' },
      ...entries.map(([category, shortcuts]) =>
        h('div', { class: 'shortcuts-category', key: category }, [
          h('div', { class: 'category-header' }, [
            h('span', { class: 'category-title' }, category),
            h('span', { class: 'shortcuts-count' }, String(shortcuts.length)),
          ]),
          h(
            'ul',
            { class: 'shortcuts-list' },
            ...shortcuts.map((s) =>
              h('li', { class: 'shortcut-item', key: `${s.keys}-${s.description}` }, [
                h('span', { class: 'shortcut-description' }, s.description),
                h('kbd', { class: 'shortcut-key' }, formatShortcut(s.keys)),
              ])
            )
          ),
        ])
      )
    );
  }

  private content(): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    return foreign((host, scope) => {
      let filter = '';
      const shell = mount(
        host,
        h('div', { class: 'shortcuts-menu-body' }, [
          h('div', { class: 'shortcuts-search' }, [
            h('input', {
              class: 'shortcuts-search-input',
              attrs: {
                type: 'search',
                placeholder: t('shortcuts.searchShortcuts'),
              },
              on: {
                input: (e) => {
                  filter = (e.target as HTMLInputElement).value;
                  paintList();
                },
              },
            }),
          ]),
          h('div', { class: 'shortcuts-list-host', ref: 'list' }),
        ])
      );
      scope.own(shell);

      let listMount: ReturnType<typeof mount> | null = null;
      const paintList = () => {
        const listHost = shell.refs.list;
        // oxlint-disable-next-line typescript/strict-boolean-expressions -- non-null object guard
        if (!listHost) {
          return;
        }
        listMount?.destroy();
        listMount = mount(listHost, this.listSpec(filter));
      };
      scope.disposable(() => listMount?.destroy());
      paintList();
    });
  }

  show(): void {
    this.popups.open({
      title: this.editor.t('shortcuts.title'),
      className: 'shortcuts-menu',
      size: 'lg',
      closeOnClickOutside: true,
      items: [
        {
          type: 'view',
          id: 'shortcuts-content',
          view: () => this.content(),
        },
      ],
    });
  }
}
