# Code Block Plugin

`CodeBlockPlugin` is the shared code surface for both editors:

- **WYSIWYG (`surface: 'atom'`)** — Insert menu embeds a `code_block` atom. Edit via modal hosting the shared source editor (widget is not contenteditable). Shipped in `createDefaultPlugins()`.
- **Code app (`surface: 'workspace'`)** — full-height source editor that owns the document (`on-codemerge/code`).

Language is free-text **metadata** (fence / status / download). Paint always uses one shared internal structural ruleset — the same contour as JSON Raw / Markdown source (not a separate public npm package).

## Demo (WYSIWYG embed)

Live code-block atom. **Insert → Code block** / `Mod-Alt-Q` opens the modal; double-click or context menu edits.

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['CodeBlockPlugin']"
  :showDescription="false"
  :showResults="false"
/>

> Full Code-only app: [Code Editor](/guide/code-editor) · compare surfaces: [Editors](/guide/editors).

## Basic usage

### Atom (inside WYSIWYG)

```ts
import { Editor, CodeBlockPlugin, createDefaultPlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

// Included in createDefaultPlugins() as CodeBlockPlugin({ surface: 'atom' })
const editor = new Editor(host, {
  plugins: createDefaultPlugins(),
});

// Or alone:
new Editor(host, {
  plugins: [CodeBlockPlugin({ surface: 'atom', features: { toolbar: true } })],
});

editor.command('insertCodeBlock');
```

Document node: `code_block` atom with `{ language: string; code: string }` (`CodeBlockAttrs`). In the editor: read-only widget + modal source editor. **Published HTML** / `getHTML()`: `<pre data-language="…"><code>…</code></pre>` with structural highlight spans.

### Workspace (Code-only app)

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/code';

const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // HistoryChrome + CodeBlockPlugin({ surface: 'workspace' })
});

editor.setText('const x = 1;\n');
console.log(editor.getText());
```

SoT node: `code_source` with `{ text: string; language: string }` (`CodeSourceAttrs`). Seed with `emptyEditorDoc(text?, language?)`.

## Options

```ts
CodeBlockPlugin({
  surface: 'workspace' | 'atom', // default 'atom'
  /** Sole source of workspace bar buttons. Omit → defaultCodeToolbar(). */
  toolbar?: { menus?: …; items?: … },
  /** Atom Insert placement (`PluginToolbarOpts`). `menu: null` → bar. */
  menu?: string | null,
  group?: string,
  order?: number,
  features?: {
    toolbar?: boolean; // Insert button (atom only); default true
    historyChrome?: boolean; // include HistoryChromePlugin in createDefaultPlugins
  },
});
```

Workspace bar buttons never come from feature flags — configure `toolbar` (or use `defaultCodeToolbar` / `createDefaultPlugins()`). Atom chrome never runs on `surface: 'workspace'`; atom Insert uses `menu` / `group` / `order`.

### Custom toolbar

```ts
import { defaultCodeToolbar } from 'on-codemerge/code';

const base = defaultCodeToolbar();
CodeBlockPlugin({
  surface: 'workspace',
  toolbar: {
    menus: base.menus,
    items: [
      ...(base.items ?? []),
      {
        id: 'code-ping',
        label: 'Ping',
        menu: 'edit',
        run: ({ editor, workspace }) => {
          editor.notify('ok');
          workspace?.focus();
        },
      },
    ],
  },
});
```

| Field     | Role                                                    |
| --------- | ------------------------------------------------------- |
| `command` | SDK `ToolbarButton.command` → `onCommand`               |
| `run`     | Deferred click (`{ editor, workspace }`) — prefer `run` |

Default workspace menus: **Edit** (copy / select all / clear / indent / outdent) and **File** (download / upload). Undo/redo = `HistoryChromePlugin`.

## Commands

| Command           | Surface | Role                             |
| ----------------- | ------- | -------------------------------- |
| `insertCodeBlock` | atom    | Open modal → insert `code_block` |

Edit and copy use the atom context menu / widget header — there are no separate `editCodeBlock` / `copyCodeBlock` commands.

## Keyboard

| Shortcut          | Surface                    | Command                           |
| ----------------- | -------------------------- | --------------------------------- |
| `Mod-Alt-Q`       | atom                       | `insertCodeBlock`                 |
| `Mod-z` / `Mod-y` | workspace (focused source) | Local source-buffer undo/redo     |
| Toolbar History   | workspace                  | Kernel SoT undo/redo after commit |

## Context menu (atom)

Right-click a code block:

- **Edit Code Block** — open modal (source editor)
- **Copy Code** — clipboard

## HTML boundary (`getHTML` / `setHTML`)

```html
<pre data-language="javascript"><code>console.log("Hello World");</code></pre>
```

`data-language` is metadata only — highlight does not switch grammars. Live chrome (`.code-block` header / copy button) is view-only and is not the HTML export shape.

## Troubleshooting

1. Highlighting missing — ensure published / editor CSS includes shared `.token.*` styles from the source-editor contour.
2. Edit does nothing — use the context menu / modal; the widget itself is not contenteditable.
3. Workspace throws on mount — seed `emptyEditorDoc()` and use `createShellView` / `on-codemerge/code` (not a prose CE host).
4. Document not updating — listen to `editor.on('docChanged')`; `getText()` flushes the debounce window.
