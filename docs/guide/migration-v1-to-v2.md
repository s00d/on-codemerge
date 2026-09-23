# Migration guide: v1 → v2

on-codemerge **2.x** rewrites the editor around a virtual JSON document (`on-codemerge/kernel`), an SDK surface (`on-codemerge/sdk`), and plugins that **never own DOM**.

Full v1 docs (trimmed archive): [docs/v1](/v1/).

## Quick map

| v1                                          | v2                                                       |
| ------------------------------------------- | -------------------------------------------------------- |
| `HTMLEditor`                                | `Editor`                                                 |
| `new ToolbarPlugin()` class                 | `ToolbarPlugin()` factory (mark buttons only)            |
| Plugin owns toolbar DOM                     | Core `ToolbarPanel` via `ctx.toolbar.add` / `defineMenu` |
| `PopupManager` / `createElement` in plugins | `ctx.popup` / `ctx.menu` / ViewSpec + portals            |
| HTML as source of truth                     | JSON: `getJSON` / `setJSON` (HTML is a boundary)         |
| `plugins/FooPlugin/style.css` CDN           | `on-codemerge/index.css` + `public.css`                  |
| Jest                                        | Vitest (+ Playwright / untestutils for e2e)              |

## Install

```bash
pnpm add on-codemerge
# workspace packages are re-exported from the main package
```

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins, insertText } from 'on-codemerge';

const editor = new Editor(host, { plugins: createDefaultPlugins() });
editor.run(insertText('Hello'));
```

Use `createCorePlugins()` for a lean bar, or pass an explicit factory list.

## Plugins

```ts
import { definePlugin, core, insertAtomAfter } from 'on-codemerge/sdk';
// or from 'on-codemerge'

export function MyPlugin() {
  return definePlugin({
    name: 'my-plugin',
    commands: {
      insertThing: insertAtomAfter('myAtom', {}),
    },
    setup(ctx) {
      // Top-level bar
      ctx.toolbar.add({
        id: 'my-bar',
        label: 'My',
        group: 'format',
        order: 20,
        onClick: () => ctx.editor.command('insertThing'),
      });

      // Or into a named overflow menu (Insert / Review / Tools)
      ctx.toolbar.add({
        id: 'my-insert',
        label: 'Thing',
        menu: 'insert',
        order: 80,
        onClick: () => ctx.editor.command('insertThing'),
      });
    },
  });
}
```

Rules:

1. Import UI/helpers from `on-codemerge/sdk` (or `on-codemerge`) — not `on-codemerge/kernel` from a plugin.
2. No `document.createElement` / `.innerHTML =` outside SDK `foreign(...)` / widgets.
3. Overlays go through portals (`popup` / `menu` / `notify`) — see [Plugin guide](/guide/authoring-plugins).

## Toolbar chrome vs ToolbarPlugin

- **Chrome** (the sticky bar) is always created by `Editor` → SDK `ToolbarPanel`.
- **`ToolbarPlugin()`** only registers Bold / Italic / Underline / Strike.
- Overflow menus **`insert` / `review` / `tools`** are registered by **`Editor`** itself. Other plugins put buttons there with `menu: 'insert' | 'review' | 'tools'`.
- `ToolbarDividerPlugin` is a no-op; separators come from `group` changes on the bar.
- There is **no** `ToolbarMenusPlugin` — removed in favor of core registration.

## Persistence

```ts
// Prefer JSON
const json = editor.getJSON();
editor.setJSON(json);

// HTML when integrating with legacy CMS
const html = editor.getHTML();
editor.setHTML(html);
```

## Removed / renamed APIs

- `editor.showToolbar` / `hideToolbar` / `addToolbarTool` — gone; use `editor.toolbar.add`.
- `editor.remove(plugin)` / `getPlugins()` — not on `Editor`; dispose via plugin scope / recreate editor.
- `createToolbarButton` — deleted; use `ctx.toolbar.add`.
- Per-plugin CSS package exports — use bundled `index.css` / `public.css`.

## Testing

Unit: Vitest (`pnpm test:unit`). Browser: untestutils + Playwright (`pnpm test:e2e`).

## Further reading

- [Editor API](/guide/editor)
- [Plugin guide](/guide/authoring-plugins)
- [Core model](/guide/document-model)
- [Plugins overview](/plugins/)
