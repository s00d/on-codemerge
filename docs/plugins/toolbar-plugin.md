# Toolbar Plugin (default marks)

> **v2:** The sticky toolbar chrome is owned by the SDK (`ToolbarPanel` inside `Editor`).  
> `ToolbarPlugin()` only registers **Bold / Italic / Underline / Strike** mark buttons.

## Usage

```ts
import { Editor, ToolbarPlugin, HistoryPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(container, {
  plugins: [ToolbarPlugin(), HistoryPlugin()],
});
```

Or simply `createDefaultPlugins()` / `createCorePlugins()`.

Overflow menus **Insert / Review / Tools** are registered by `Editor` itself — no extra plugin.

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ToolbarPlugin', 'HistoryPlugin']" />

## What it does

| Id          | Action           |
| ----------- | ---------------- |
| `bold`      | Toggle bold mark |
| `italic`    | Toggle italic    |
| `underline` | Toggle underline |
| `strike`    | Toggle strike    |

Buttons use `group: 'marks'` so they sit together on the left of the bar.

## What it does **not** do

- Does **not** create/destroy the toolbar host (that is `Editor` → `ToolbarPanel`).
- Does **not** provide `showToolbar` / `hideToolbar` / `addToolbarTool` (removed in v2).
- Does **not** load `plugins/ToolbarPlugin/style.css` — use `on-codemerge/index.css`.

## Adding your own tools

```ts
ctx.toolbar.add({
  id: 'my-tool',
  label: 'My',
  group: 'format', // bar segment
  order: 20,
  onClick: () => {
    /* … */
  },
});

// Or into Insert / Review / Tools overflow menus (core-owned):
ctx.toolbar.add({
  id: 'my-insert',
  label: 'Insert X',
  menu: 'insert',
  order: 90,
  onClick: () => {
    /* … */
  },
});
```

See [Plugin guide — Toolbar menus](/guide/authoring-plugins#toolbar-bar-vs-menus) and [Migration](/guide/migration-v1-to-v2).

## Related

- [Authoring plugins — Toolbar](/guide/authoring-plugins#toolbar-bar-vs-menus) — bar vs menus; separators via `group`
- [Migration v1 → v2](/guide/migration-v1-to-v2)
