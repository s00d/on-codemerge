# Editor API

Single public API: **`Editor`** + **plugins** on a virtual document kernel. The kernel model is JSON (`getJSON` / `setJSON`). For app integrate / persist, prefer **HTML** (`getHTML` / `setHTML`) or **Markdown** (`getMarkdown` / `setMarkdown`) — see [Integrate](/integrate/).

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins, insertText } from 'on-codemerge';

const editor = new Editor(document.getElementById('editor')!, {
  plugins: createDefaultPlugins(),
});
editor.run(insertText('Hello'));
```

## Getting Started

1. Install `on-codemerge`
2. Import `index.css` + `public.css`
3. Construct `Editor(host, { plugins: [...] })`
4. Load / save with `setHTML` / `getHTML` (or Markdown). Use `getJSON` / `setJSON` when you need the kernel snapshot.

```ts
import { Editor, ToolbarPlugin, AlignmentPlugin, ListsPlugin } from 'on-codemerge';

const editor = new Editor(host, {
  plugins: [ToolbarPlugin(), AlignmentPlugin(), ListsPlugin()],
});

editor.setHTML(localStorage.getItem('doc-html') ?? '<p></p>');
editor.on('docChanged', () => {
  localStorage.setItem('doc-html', editor.getHTML());
});

editor.command('bulletList');
```

## Core owns UI

- Toolbar **panel** is created by the editor (`editor.toolbar.add`)
- Popups: `editor.ui.popup` / plugin `ctx.popup`
- Context menus: `editor.ui.menu`
- Toasts: `editor.notify(...)`
- i18n: `editor.t` / `editor.setLocale` / `editor.registerLocale`

Plugins never own the panel or reinvent modals. Authoring surface: [SDK reference](./sdk.md).

## Options

| Option                                   | Role                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `plugins`                                | Plugin factories (`XPlugin()` / `createDefaultPlugins()`)                                                           |
| `doc`                                    | Initial `DocNode` / JSON doc                                                                                        |
| `history`                                | `{ maxDepth?, mergeWindowMs? }`                                                                                     |
| `locale` / `fallbackLocale` / `messages` | i18n bootstrap                                                                                                      |
| `colorScheme`                            | `host` (default — leave `<html class="dark">` alone) or `system` (sync `prefers-color-scheme` to `documentElement`) |
| `chrome`                                 | `bar` (default sticky chrome) or `page` (popup toolbar) — see [Chrome & host](/integrate/chrome-and-host)           |

## Document API

| Method                                       | Role                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `getJSON()` / `setJSON(doc)`                 | Kernel document (collab / advanced sync)                                |
| `getHTML()` / `setHTML(html)`                | Usual app load/save (semantic HTML; atoms as empty `data-node` shells)  |
| `getMarkdown()` / `setMarkdown(md)`          | Markdown load/save (CommonMark/GFM subset)                              |
| `getPublishedHTML()`                         | Hydrated HTML for published pages (plugin `publish.render` fills atoms) |
| `getPublishedJS()`                           | `dist/public.js` href when runtimes are needed; otherwise `null`        |
| `getPublishedDocument()`                     | Standalone HTML document (`public.css` + optional `public.js`)          |
| `run(command)`                               | Execute a command function                                              |
| `command(name, …args)`                       | Named plugin/core command                                               |
| `use(plugin)`                                | Register a plugin after construct                                       |
| `on('docChanged' \| 'selectionChanged', cb)` | Subscriptions — callback receives editor **state**                      |
| `destroy()`                                  | Tear down editor + plugins                                              |

### Boundaries: JSON vs HTML vs Markdown vs published

```ts
const html = editor.getHTML();
editor.setHTML(html);

const md = editor.getMarkdown();
editor.setMarkdown('# Title\n\nHello **world**');

const json = editor.getJSON(); // optional kernel snapshot
editor.setJSON(json);

const published = editor.getPublishedHTML();
const page = editor.getPublishedDocument();
```

| Format                | Use when                                                              |
| --------------------- | --------------------------------------------------------------------- |
| `getHTML` / `setHTML` | Default app persistence, paste, SSR shells                            |
| Markdown              | Notes apps, CMS that store MD, `ExportPlugin` → `.md`                 |
| JSON                  | Collab, advanced sync, undo internals                                 |
| `getPublished*`       | Public pages, export HTML/PDF, live preview with `public.js` runtimes |

Atoms (timer, calendar, …) stay as `data-node="…"` + attrs in **semantic** HTML. Published HTML runs each plugin’s `publish.render` and may set `data-ocm-runtime` / `data-ocm-config` for `dist/public.js`.

### Headless IO (no `Editor` instance)

Same adapters the editor uses, exported from the package root:

```ts
import {
  importHTML,
  exportHTML,
  exportPublishedHTML,
  importMarkdown,
  exportMarkdown,
  docToMarkdown,
  markdownToDoc,
  sanitizeHTML,
  serializeJSON,
  parseJSON,
} from 'on-codemerge';

const doc = importMarkdown('# Hi');
const md = exportMarkdown(doc);
const html = exportHTML(doc);
```

`exportPublishedHTML(doc, publishers)` needs the publish-node map from plugins (`collectPublishNodes` in the SDK) — prefer `editor.getPublishedHTML()` when an editor exists.

## Plugin System

Plugins are **factory functions** that return a sealed plugin descriptor (`definePlugin`). Pass them in the constructor:

```ts
import { Editor, TablePlugin, ImagePlugin } from 'on-codemerge';

const editor = new Editor(host, {
  plugins: [TablePlugin(), ImagePlugin()],
});
```

To author a plugin, see [Authoring plugins](./authoring-plugins.md) and the [SDK reference](./sdk.md).

## Localization

UI copy uses **semantic nested keys** via [`@i18n-micro/runtime`](https://github.com/s00d/nuxt-i18n-micro). Only `en` is bundled; other packs under `src/i18n/locales/` load on demand.

```ts
await editor.setLocale('ru');
await editor.setLocale('en'); // same API
editor.t('toolbar.bold');
editor.t('greeting', { name: 'Ada' });
editor.listLocales();
editor.registerLocale('xx', { toolbar: { bold: 'Bold-XX' } });
```

Namespaces: `common.*`, `toolbar.*`, `table.*`, `formBuilder.*`, … Missing keys fall back to `fallbackLocale` (`en`), then the key string.

`LanguagePlugin` is optional UI for picking a language; loading does not depend on it.

## Related

- [SDK reference](./sdk.md) — `on-codemerge/sdk` public surface
- [Authoring plugins](./authoring-plugins.md) — definePlugin, toolbar menus, portals, publish
- [Document model](./document-model.md)
- [Migration v1 → v2](./migration-v1-to-v2.md)
- [Integrate](/integrate/) — framework-specific setups
- [Chrome & host](/integrate/chrome-and-host) — `chrome` + hosting / portals
- [Export plugin](/plugins/export-plugin) — UI menu over the same boundaries
