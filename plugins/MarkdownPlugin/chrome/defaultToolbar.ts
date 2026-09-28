import {
  blockquoteIcon,
  boldIcon,
  bubbleIcon,
  clearIcon,
  formatIcon,
  h1Icon,
  h2Icon,
  h3Icon,
  hrIcon,
  insertIcon,
  italicIcon,
  linkIcon,
  listBulletIcon,
  listNumberedIcon,
  preIcon,
  strikethroughIcon,
} from '@ocm/wysiwyg/icons';
import {
  applyBullet,
  applyCallout,
  applyCodeFence,
  applyHeading,
  applyHr,
  applyInlineMark,
  applyLink,
  applyMermaid,
  applyOrdered,
  applyQuote,
  clearMdStyles,
} from '../commands/mdSourceOps';
import type { MdEdit } from '../commands/mdSourceOps';
import { changeCalloutKindAt } from '../elements/calloutEdit';
import type { MdElementRegistry } from '../elements/types';
import type { MdToolbarActionApi, MdToolbarItem, MdToolbarOptions } from './types';

export type DefaultMdToolbarOptions = {
  /** Callout kinds → Insert / Turn into items. */
  elements: MdElementRegistry;
};

function applySource(
  transform: (text: string, from: number, to: number) => MdEdit
): (api: MdToolbarActionApi) => void {
  return ({ editor, workspace }) => {
    if (!workspace) {
      editor.notify('Markdown source pane is not ready');
      return;
    }
    const { from, to } = workspace.getSelection();
    const next = transform(workspace.getDraftText(), from, to);
    workspace.replaceText(next.text, next.cursor);
    workspace.focus();
  };
}

/** Named command with CM→SoT flush (toolbar `command` items / atom surface). */
export function runMdCommand(name: string): (api: MdToolbarActionApi) => void {
  return ({ editor, workspace }) => {
    workspace?.flushPendingSoT();
    if (!editor.command(name)) {
      editor.notify('Could not apply toolbar action');
      return;
    }
    workspace?.focus();
  };
}

/** Insert plain Markdown at the CM cursor (replaces former `insertMarkdown` sugar). */
export function runInsertMarkdown(
  snippet: string | (() => string)
): (api: MdToolbarActionApi) => void {
  return ({ editor, workspace }) => {
    if (!workspace) {
      editor.notify('Markdown source pane is not ready');
      return;
    }
    const text = typeof snippet === 'function' ? snippet() : snippet;
    workspace.insertAtCursor(text);
    workspace.focus();
  };
}

/**
 * Markdown domain toolbar preset.
 * Marks (B/I/S/`/link) are top-level like WYSIWYG ToolbarPlugin.
 * Insert / Turn into cover blocks. Undo/redo — `HistoryChromePlugin`.
 */
export function defaultMdToolbar(opts: DefaultMdToolbarOptions): MdToolbarOptions {
  const { elements } = opts;

  const items: MdToolbarItem[] = [
    // —— inline marks (group: marks) ——
    {
      id: 'md-bold',
      icon: boldIcon,
      label: () => 'Bold',
      title: () => 'Bold',
      group: 'marks',
      order: 1,
      run: applySource((text, from, to) => applyInlineMark(text, from, to, '**', '**')),
    },
    {
      id: 'md-italic',
      icon: italicIcon,
      label: () => 'Italic',
      title: () => 'Italic',
      group: 'marks',
      order: 2,
      run: applySource((text, from, to) => applyInlineMark(text, from, to, '*', '*')),
    },
    {
      id: 'md-strike',
      icon: strikethroughIcon,
      label: () => 'Strikethrough',
      title: () => 'Strikethrough',
      group: 'marks',
      order: 3,
      run: applySource((text, from, to) => applyInlineMark(text, from, to, '~~', '~~')),
    },
    {
      id: 'md-code',
      icon: preIcon,
      label: () => 'Inline code',
      title: () => 'Inline code',
      group: 'marks',
      order: 4,
      run: applySource((text, from, to) => applyInlineMark(text, from, to, '`', '`', 'code')),
    },
    {
      id: 'md-link',
      icon: linkIcon,
      label: () => 'Link',
      title: () => 'Insert link',
      group: 'marks',
      order: 5,
      run: applySource((text, from, to) => applyLink(text, from, to)),
    },
    {
      id: 'md-clear-styles',
      icon: clearIcon,
      label: () => 'Clear styles',
      title: () => 'Clear styles (selection or whole document)',
      group: 'marks',
      order: 8,
      run: applySource((text, from, to) => clearMdStyles(text, from, to)),
    },
    // —— blocks (Insert menu) ——
    {
      id: 'md-insert-h1',
      icon: h1Icon,
      label: () => 'Heading 1',
      title: () => 'Turn into heading 1',
      menu: 'md-insert',
      order: 10,
      run: applySource((text, from, to) => applyHeading(text, from, to, 1)),
    },
    {
      id: 'md-insert-h2',
      icon: h2Icon,
      label: () => 'Heading 2',
      title: () => 'Turn into heading 2',
      menu: 'md-insert',
      order: 20,
      run: applySource((text, from, to) => applyHeading(text, from, to, 2)),
    },
    {
      id: 'md-insert-h3',
      icon: h3Icon,
      label: () => 'Heading 3',
      title: () => 'Turn into heading 3',
      menu: 'md-insert',
      order: 30,
      run: applySource((text, from, to) => applyHeading(text, from, to, 3)),
    },
    {
      id: 'md-insert-quote',
      icon: blockquoteIcon,
      label: () => 'Quote',
      title: () => 'Turn into blockquote',
      menu: 'md-insert',
      order: 40,
      run: applySource((text, from, to) => applyQuote(text, from, to)),
    },
    {
      id: 'md-insert-list',
      icon: listBulletIcon,
      label: () => 'Bullet list',
      title: () => 'Turn into bullet list',
      menu: 'md-insert',
      order: 50,
      run: applySource((text, from, to) => applyBullet(text, from, to)),
    },
    {
      id: 'md-insert-ordered',
      icon: listNumberedIcon,
      label: () => 'Numbered list',
      title: () => 'Turn into numbered list',
      menu: 'md-insert',
      order: 55,
      run: applySource((text, from, to) => applyOrdered(text, from, to)),
    },
    {
      id: 'md-insert-code',
      icon: preIcon,
      label: () => 'Code block',
      title: () => 'Wrap as fenced code',
      menu: 'md-insert',
      order: 60,
      run: applySource((text, from, to) => applyCodeFence(text, from, to)),
    },
    {
      id: 'md-insert-mermaid',
      icon: preIcon,
      label: () => 'Mermaid',
      title: () => 'Insert / wrap mermaid diagram',
      menu: 'md-insert',
      order: 70,
      run: applySource((text, from, to) => applyMermaid(text, from, to)),
    },
    {
      id: 'md-insert-hr',
      icon: hrIcon,
      label: () => 'Horizontal rule',
      title: () => 'Insert thematic break',
      menu: 'md-insert',
      order: 75,
      run: applySource((text, from, to) => applyHr(text, from, to)),
    },
    {
      id: 'md-insert-btn',
      icon: linkIcon,
      label: () => 'Button line',
      title: () => 'Insert @btn into source',
      menu: 'md-insert',
      order: 80,
      run: runInsertMarkdown('@btn[Label](#)\n'),
    },
  ];

  let order = 100;
  for (const el of elements.list()) {
    const id = el.id;
    const label = el.label;
    const title = el.defaultTitle ?? label;
    items.push(
      {
        id: `md-insert-${id}`,
        icon: bubbleIcon,
        label: () => label,
        title: () => `Insert / wrap ${label} callout`,
        menu: 'md-insert',
        order,
        run: applySource((text, from, to) =>
          applyCallout(text, from, to, id, title, (src, pos, kind) => {
            const known = new Set(elements.ids());
            return changeCalloutKindAt(src, pos, kind, known);
          })
        ),
      },
      {
        id: `md-turninto-${id}`,
        icon: bubbleIcon,
        label: () => label,
        title: () => `Turn callout into ${label}`,
        menu: 'md-turninto',
        order,
        run: ({ editor, workspace }) => {
          if (!workspace) {
            return;
          }
          const known = new Set(elements.ids());
          const pos = workspace.getCursor();
          const next = changeCalloutKindAt(workspace.getDraftText(), pos, id, known);
          if (!next) {
            editor.notify('Place the cursor inside a :::callout block (or insert one first)');
            return;
          }
          workspace.replaceText(next.text, next.cursor);
          workspace.focus();
        },
      }
    );
    order += 10;
  }

  return {
    menus: [
      { id: 'md-insert', label: () => 'Insert', icon: insertIcon, order: 10 },
      { id: 'md-turninto', label: () => 'Turn into', icon: formatIcon, order: 15 },
    ],
    items,
  };
}
