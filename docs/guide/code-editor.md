# Code Editor

Plain-text source product published as **`on-codemerge/code`**. Thin app entry uses a shell ViewPort and **`CodeBlockPlugin({ surface: 'workspace' })`**, which mounts the shared source-editor contour (gutter + universal structural highlight) into `contentTarget`. Interchange via `getText` / `setText`.

<script setup>
import CodeEditorComponent from '../components/CodeEditorComponent.vue';
</script>

<CodeEditorComponent :showDescription="false" />

## Install

```bash
npm install --save on-codemerge
```

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/code';

const host = document.getElementById('code-editor')!;
const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // HistoryChrome + CodeBlockPlugin({ surface: 'workspace' })
});

editor.on('docChanged', () => {
  console.log(editor.getText());
});

editor.setText('const x = 1;\n');
editor.destroy();
```

`createView` defaults to `createShellView` (stable content host). Host Vue/React: mount → `destroy()` on unmount. Local SPA: `pnpm dev:code`.

### Same plugin in WYSIWYG

```ts
import { Editor, createDefaultPlugins, CodeBlockPlugin } from 'on-codemerge';

new Editor(host, {
  plugins: [
    ...createDefaultPlugins(), // includes CodeBlockPlugin({ surface: 'atom' })
    // or explicit:
    // CodeBlockPlugin({ surface: 'atom', features: { toolbar: true } }),
  ],
});
```

`surface: 'atom'` registers the `code_block` atom and **Insert → Code block** (`Mod-Alt-Q`). Full-height source takes over the work area only with `surface: 'workspace'`. See [Code Block Plugin](/plugins/code-block-plugin) and [Editors](/guide/editors).

### Types

Published types for `on-codemerge/code` expect TypeScript `moduleResolution: "bundler"` (or `skipLibCheck: true`). `Node16` / `NodeNext` type resolution against shipped `.d.ts` is unsupported. Runtime ESM/CJS is fine.

## Document API

| Method                       | Role                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `getText()`                  | Plain source (flushes pending workspace debounce first)            |
| `setText(text)`              | Replace SoT; returns `ParseError \| null` (SoT unchanged on error) |
| `getJSON()` / `setJSON(doc)` | Kernel document snapshot (`doc → code_source`)                     |
| `run` / `command` / `use`    | Same as WYSIWYG                                                    |
| `on('docChanged', …)`        | Subscriptions                                                      |
| `destroy()`                  | Tear down (flushes pending source → SoT)                           |

Prose-only methods (`getHTML`, `setMarkdown`, publish helpers, …) are stubs (`''` / `null` / no-op) — they do **not** throw.

## Document shape

SoT is `doc` → single `code_source` child:

```ts
type CodeSourceAttrs = {
  text: string;
  language: string; // metadata only — does not switch highlighter grammar
};
```

Paint uses one shared universal structural ruleset (comments, strings, numbers, …) — the same contour as JSON Raw and Markdown source. Language is free-text metadata for fences / status / download extension (sanitized).

## Toolbar

`createDefaultPlugins()` ships **HistoryChrome** (undo/redo on kernel SoT) plus **Edit** and **File** overflow menus (copy / select all / clear / indent / outdent / download / upload). Language is editable in the status strip.

Local source-buffer undo (typing / Tab / paste) is keyboard-only: **Mod-z / Mod-y** on the focused editor. Toolbar History walks document history after SoT commits (debounced ~200ms while typing).

Customize via `toolbar` / `createDefaultPlugins({ toolbar })` / `new Editor(host, { toolbar })` — extend `defaultCodeToolbar()`.

```ts
import { Editor, defaultCodeToolbar } from 'on-codemerge/code';

const base = defaultCodeToolbar();
new Editor(host, {
  chrome: 'bar',
  toolbar: {
    menus: base.menus,
    items: [
      ...(base.items ?? []),
      {
        id: 'code-ping',
        label: 'Ping',
        menu: 'edit',
        run: ({ editor }) => editor.notify('ok'),
      },
    ],
  },
});
```

## CodeBlockPlugin options

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

## Local demo

```bash
pnpm dev:code    # apps/code SPA
pnpm build:code  # → dist-code/
```

## See also

- [Editors](./editors.md) — four-product matrix
- [Code Block Plugin](/plugins/code-block-plugin) — atom + workspace options
- [Editor API](./editor.md) — WYSIWYG entry (`on-codemerge`)
- [Document model](./document-model.md) — kernel DocNode / ops
- [Integrate](/integrate/) — host frameworks
