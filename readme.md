[![npm version](https://img.shields.io/npm/v/on-codemerge/latest?style=for-the-badge)](https://www.npmjs.com/package/on-codemerge)
[![npm downloads](https://img.shields.io/npm/dw/on-codemerge?style=for-the-badge)](https://www.npmjs.com/package/on-codemerge)
[![npm license](https://img.shields.io/npm/l/on-codemerge?style=for-the-badge)](https://github.com/s00d/on-codemerge/blob/main/LICENSE)
[![npm type definitions](https://img.shields.io/npm/types/on-codemerge?style=for-the-badge)](https://www.npmjs.com/package/on-codemerge)
[![GitHub issues](https://img.shields.io/badge/github-issues-orange?style=for-the-badge)](https://github.com/s00d/on-codemerge/issues)
[![GitHub stars](https://img.shields.io/badge/github-stars-yellow?style=for-the-badge)](https://github.com/s00d/on-codemerge/stargazers)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue?style=for-the-badge)](https://s00d.github.io/on-codemerge/)
[![Donate](https://img.shields.io/badge/Donate-Donationalerts-ff4081?style=for-the-badge)](https://www.donationalerts.com/r/s00d88)

<p align="center">
  <img src="https://github.com/s00d/on-codemerge/blob/main/branding/banner-readme.png?raw=true" alt="on-CodeMerge" width="720">
</p>

# on-codemerge

**Four editors on one kernel + SDK.** JSON `doc` is the source of truth. Toolbar, popups, and menus live in a **core-owned SDK** — plugins register into it, they do not own chrome.

| Product      | Import                  | Document                     | UI                                    |
| ------------ | ----------------------- | ---------------------------- | ------------------------------------- |
| **WYSIWYG**  | `on-codemerge`          | Prose JSON (marks, atoms, …) | ContentEditable + widgets             |
| **JSON**     | `on-codemerge/json`     | JSON tree                    | Shell — Tree / Raw                    |
| **Markdown** | `on-codemerge/markdown` | Prose JSON (MD block subset) | Shell — dual-pane source + preview    |
| **Code**     | `on-codemerge/code`     | Plain text (`code_source`)   | Shell — gutter + structural highlight |

[Documentation](https://s00d.github.io/on-codemerge/) · [Editors](https://s00d.github.io/on-codemerge/guide/editors.html) · [Plugins](https://s00d.github.io/on-codemerge/plugins/) · [Integrate](https://s00d.github.io/on-codemerge/integrate/) · [npm](https://www.npmjs.com/package/on-codemerge)

<p align="center">
  <img src="https://github.com/s00d/on-codemerge/blob/main/branding/Screenshot-v2-editor.png?raw=true" alt="Editor demo — toolbar, lists, table" width="900">
</p>

<p align="center">
  <img src="https://github.com/s00d/on-codemerge/blob/main/branding/Screenshot-v2-insert.png?raw=true" alt="Insert menu — blocks, media, charts, forms" width="900">
</p>

---

## Features

- **Four editor surfaces** — WYSIWYG, JSON workspace, Markdown dual-pane, Code source (same package)
- **JSON document model** — `getJSON` / `setJSON` as SoT; HTML and Markdown are import/export boundaries
- **Core-owned UI** — `editor.toolbar`, `editor.ui.popup`, context menu, notify; plugins only register
- **Plugin packs** — `createDefaultPlugins()` or lean `createCorePlugins()`
- **Published pages** — `getPublishedHTML` / `getPublishedDocument` + `dist/public.js` runtimes (WYSIWYG / Markdown)
- **Source contour** — shared gutter + structural highlight for JSON Raw, Markdown source, and Code
- **i18n** — lazy locale packs (`en` bundled; `ru`, `de`, `fr`, … on demand)
- **Chrome modes** — sticky toolbar (`bar`) or page-embed float (`page`)
- **TypeScript-first** — typed `Editor` + `@on-codemerge/sdk` / kernel packages

## Installation

```bash
npm install on-codemerge
# or
pnpm add on-codemerge
# or
yarn add on-codemerge
```

## Quick start

### WYSIWYG (`on-codemerge`)

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins, insertText } from 'on-codemerge';

const host = document.getElementById('editor')!;
const editor = new Editor(host, {
  plugins: createDefaultPlugins(),
});

editor.run(insertText('Hello'));
console.log(editor.getJSON());
```

Lean essentials only:

```ts
import { Editor, createCorePlugins } from 'on-codemerge';

const editor = new Editor(host, {
  plugins: createCorePlugins(),
});
```

Published preview:

```ts
const html = editor.getPublishedHTML();
// pair with on-codemerge/public.css + dist/public.js when runtimes are needed
```

### JSON (`on-codemerge/json`)

Tree + Raw for configuration / API payloads. Interchange via `getText` / `setText`.

```ts
import 'on-codemerge/index.css';
import { Editor, createDefaultPlugins } from 'on-codemerge/json';

const editor = new Editor(document.getElementById('json')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('{"hello":true}');
```

### Markdown (`on-codemerge/markdown`)

Dual-pane source + HTML preview (callouts, mermaid, …).

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins } from 'on-codemerge/markdown';

const editor = new Editor(document.getElementById('md')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('# Hello\n');
```

### Code (`on-codemerge/code`)

Plain-text source with line gutter and structural highlight (comments, strings, numbers, …).

```ts
import 'on-codemerge/index.css';
import { Editor, createDefaultPlugins } from 'on-codemerge/code';

const editor = new Editor(document.getElementById('code')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('const x = 1;\n');
```

Full comparison: [Editors guide](https://s00d.github.io/on-codemerge/guide/editors.html).

## Docs & demos

|                     |                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Docs site**       | https://s00d.github.io/on-codemerge/                                                   |
| **Editors**         | [guide/editors](https://s00d.github.io/on-codemerge/guide/editors.html)                |
| **Editor API**      | [guide/editor](https://s00d.github.io/on-codemerge/guide/editor.html)                  |
| **SDK**             | [guide/sdk](https://s00d.github.io/on-codemerge/guide/sdk.html)                        |
| **Migrate v1 → v2** | [guide/migration](https://s00d.github.io/on-codemerge/guide/migration-v1-to-v2.html)   |
| **npm demo stand**  | [`demo/`](./demo) — WYSIWYG / JSON / Markdown / Code — `cd demo && pnpm i && pnpm dev` |

Plugins use `core.*` and `editor.toolbar` / `ctx.popup` — do not deep-import the kernel from app code.

## Package surface

| Import                    | Role                                                 |
| ------------------------- | ---------------------------------------------------- |
| `on-codemerge`            | WYSIWYG `Editor`, plugin factories, IO helpers       |
| `on-codemerge/json`       | JSON workspace `Editor` + `createDefaultPlugins`     |
| `on-codemerge/markdown`   | Markdown dual-pane `Editor` + `createDefaultPlugins` |
| `on-codemerge/code`       | Code source `Editor` + `createDefaultPlugins`        |
| `on-codemerge/sdk`        | `definePlugin`, `h` / `mount`, toolbar/popup types   |
| `on-codemerge/index.css`  | Editor chrome                                        |
| `on-codemerge/public.css` | Published page styles                                |
| `on-codemerge/public.js`  | Published page runtimes                              |

## License

[MIT](./LICENSE)
