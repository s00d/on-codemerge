# JSON Editor

Tree + Raw editor for plain JSON, published as **`on-codemerge/json`**. Thin app entry uses a shell ViewPort and **`JsonPlugin({ surface: 'workspace' })`**, which mounts the Tree/Raw UI into `contentTarget`. Plain JSON interchange via `getText` / `setText`.

<script setup>
import JsonEditorComponent from '../components/JsonEditorComponent.vue';
</script>

<JsonEditorComponent :showDescription="false" />

## Install

```bash
npm install --save on-codemerge
```

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/json';

const host = document.getElementById('json-editor')!;
const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // JsonPlugin({ surface: 'workspace', … })
});

editor.on('docChanged', () => {
  console.log(editor.getText());
});

editor.setText('{"hello":true}');
editor.destroy();
```

`createView` defaults to `createShellView` (stable content host). Host Vue/React: mount → `destroy()` on unmount.

### Same plugin in WYSIWYG

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge';
import { JsonPlugin } from 'on-codemerge'; // or from plugins barrel

new Editor(host, {
  plugins: [
    ...createDefaultPlugins(), // includes JsonPlugin({ surface: 'atom' })
    // or explicit:
    // JsonPlugin({ surface: 'atom', features: { toolbar: true } }),
  ],
});
```

`surface: 'atom'` registers JSON schema/commands and **Insert → JSON** (`json_embed` atom). Full Tree/Raw takes over the work area only with `surface: 'workspace'`. See [JSON Plugin](/plugins/json-plugin) and [Editors](/guide/editors).

### Types

Published types for `on-codemerge/json` expect TypeScript `moduleResolution: "bundler"` (or `skipLibCheck: true`). `Node16` / `NodeNext` type resolution against shipped `.d.ts` is unsupported. Runtime ESM/CJS is fine.

## Document API

| Method                       | Role                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `getText(indent?)`           | Pretty (or compact) plain JSON                                     |
| `setText(text)`              | Parse → SoT; returns `ParseError \| null` (SoT unchanged on error) |
| `getJSON()` / `setJSON(doc)` | Kernel document snapshot                                           |
| `run` / `command` / `use`    | Same as WYSIWYG                                                    |
| `on('docChanged', …)`        | Subscriptions                                                      |
| `destroy()`                  | Tear down                                                          |

Prose-only methods (`getHTML`, `setMarkdown`, publish helpers, …) are stubs (`''` / `null` / no-op) — they do **not** throw.

Workspace shows **Tree** or **Raw** (toggle in the main toolbar) — Raw replaces the tree, it is not stacked below. Invalid Raw draft does not write SoT. While Raw is dirty, Tree mode and structural edits are blocked until **Apply** or **Discard** (status bar).

## JsonPlugin options

```ts
JsonPlugin({
  surface: 'workspace' | 'atom',
  /** Sole source of workspace bar buttons. Omit → defaultJsonToolbar(). */
  toolbar?: { menus?: …; items?: … },
  features?: {
    toolbar?: boolean; // Insert embed (atom only)
    rawPane?: boolean; // Raw source editor pane (workspace)
    treeChrome?: boolean; // tree context menu (workspace)
    historyChrome?: boolean; // include HistoryChromePlugin in createDefaultPlugins
    shortcuts?: boolean; // shortcuts popup + Mod-/
  },
});
```

Same pattern as WYSIWYG plugin packs: pass `toolbar` / `createDefaultPlugins({ toolbar })` / `new Editor(host, { toolbar })`. Extend via `defaultJsonToolbar()` then spread `menus` / `items`.

## Commands

Structural edits (via toolbar / ⋮ menu / context menu / `run`):

`insertProperty`, `insertItem`, `deleteNode`, `renameKey`, `changeType`, `moveItem`, `duplicateNode`, `setValue`, plus format indent commands.

Duplicate keys on `insertProperty` / `renameKey` are **rejected** (not silently normalized).

## Local demo

```bash
pnpm dev:json    # apps/json SPA
pnpm build:json  # → dist-json/
```

## See also

- [Editor API](./editor.md) — WYSIWYG entry (`on-codemerge`)
- [Document model](./document-model.md) — kernel DocNode / ops
- [Integrate](/integrate/) — host frameworks
