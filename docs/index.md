---
layout: home

hero:
  name: 'OnCodemerge Docs'
  text: 'Plugin-oriented virtual document editor'
  actions:
    - theme: brand
      text: Editors
      link: /guide/editors
    - theme: alt
      text: Plugins
      link: /plugins/
    - theme: alt
      text: Integrate
      link: /integrate/
---

<script setup>
import HomeEditorsDemo from './components/HomeEditorsDemo.vue';
</script>

# Introduction

**On-Codemerge** v2 is a family of editors on one JSON document kernel and SDK. Toolbar, modals, and menus live in the core; plugins register via `XPlugin()` factories. Seven products share the same mount pattern — pick by document shape in [Editors](/guide/editors).

## Live demos

Switch products below. Only the active editor is mounted.

<HomeEditorsDemo />

## Getting Started

```bash
npm install --save on-codemerge
# or: yarn add on-codemerge / pnpm add on-codemerge / bun add on-codemerge
```

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins } from 'on-codemerge';

const editor = new Editor(document.getElementById('app')!, {
  plugins: createDefaultPlugins(),
});

await editor.setLocale('en');
editor.setHTML('<p>Hello</p>');
```

Launch snippets for JSON, Markdown, Code, Forms, Charts, and Calendar: [Editors](/guide/editors).

## Next

- [Editors](/guide/editors) — product matrix and launch recipes
- [Editor API](/guide/editor) — JSON / HTML / Markdown / published
- [Mermaid](/guide/mermaid) — simplified diagram subset (`@codemerge/mermaid`)
- [SDK reference](/guide/sdk) — `on-codemerge/sdk` / ViewSpec
- [Migration v1 → v2](/guide/migration-v1-to-v2)
