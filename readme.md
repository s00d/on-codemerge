[![npm version](https://img.shields.io/npm/v/on-codemerge/latest?style=for-the-badge)](https://www.npmjs.com/package/on-codemerge)
[![npm downloads](https://img.shields.io/npm/dw/on-codemerge?style=for-the-badge)](https://www.npmjs.com/package/on-codemerge)
[![npm license](https://img.shields.io/npm/l/on-codemerge?style=for-the-badge)](https://github.com/s00d/on-codemerge/blob/main/LICENSE)
[![npm type definitions](https://img.shields.io/npm/types/on-codemerge?style=for-the-badge)](https://www.npmjs.com/package/on-codemerge)
[![GitHub issues](https://img.shields.io/badge/github-issues-orange?style=for-the-badge)](https://github.com/s00d/on-codemerge/issues)
[![GitHub stars](https://img.shields.io/badge/github-stars-yellow?style=for-the-badge)](https://github.com/s00d/on-codemerge/stargazers)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue?style=for-the-badge)](https://s00d.github.io/on-codemerge/)
[![Donate](https://img.shields.io/badge/Donate-Donationalerts-ff4081?style=for-the-badge)](https://www.donationalerts.com/r/s00d88)

<p align="center">
  <img src="https://github.com/s00d/on-codemerge/blob/main/branding/png/logo-color.png?raw=true" alt="on-CodeMerge" width="220">
</p>

# on-codemerge

**Plugin-oriented virtual-document WYSIWYG editor.** JSON `doc` is the source of truth. Toolbar, popups, and menus live in a **core-owned SDK** — plugins register into it, they do not own chrome.

[Documentation](https://s00d.github.io/on-codemerge/) · [Plugins](https://s00d.github.io/on-codemerge/plugins/) · [Integrate](https://s00d.github.io/on-codemerge/integrate/) · [npm](https://www.npmjs.com/package/on-codemerge)

<p align="center">
  <img src="https://github.com/s00d/on-codemerge/blob/main/branding/Screenshot-v2-editor.png?raw=true" alt="Editor demo" width="900">
</p>

<p align="center">
  <img src="https://github.com/s00d/on-codemerge/blob/main/branding/Screenshot1.png?raw=true" alt="Toolbar and table" width="440">
  &nbsp;
  <img src="https://github.com/s00d/on-codemerge/blob/main/branding/Screenshot2.png?raw=true" alt="Charts insert" width="440">
</p>

---

## Features

- **JSON document model** — `getJSON` / `setJSON` as SoT; HTML and Markdown are import/export boundaries
- **Core-owned UI** — `editor.toolbar`, `editor.ui.popup`, context menu, notify; plugins only register
- **Plugin packs** — `createDefaultPlugins()` or lean `createCorePlugins()`
- **Published pages** — `getPublishedHTML` / `getPublishedDocument` + `dist/public.js` runtimes
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

## Docs & demos

| | |
| --- | --- |
| **Docs site** | https://s00d.github.io/on-codemerge/ |
| **Editor API** | [guide/editor](https://s00d.github.io/on-codemerge/guide/editor.html) |
| **SDK** | [guide/sdk](https://s00d.github.io/on-codemerge/guide/sdk.html) |
| **Migrate v1 → v2** | [guide/migration](https://s00d.github.io/on-codemerge/guide/migration-v1-to-v2.html) |
| **npm demo stand** | [`demo/`](./demo) — `cd demo && pnpm install && pnpm dev` |

Plugins use `core.*` and `editor.toolbar` / `ctx.popup` — do not deep-import the kernel from app code.

## Package surface

| Import | Role |
| --- | --- |
| `on-codemerge` | `Editor`, plugin factories, IO helpers |
| `on-codemerge/sdk` | `definePlugin`, `h` / `mount`, toolbar/popup types |
| `on-codemerge/index.css` | Editor chrome |
| `on-codemerge/public.css` | Published page styles |

## License

[MIT](./LICENSE)
