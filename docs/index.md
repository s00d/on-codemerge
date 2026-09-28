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
      text: Editor API
      link: /guide/editor
    - theme: alt
      text: Plugins
      link: /plugins/
    - theme: alt
      text: JSON Editor
      link: /guide/json-editor
    - theme: alt
      text: Markdown Editor
      link: /guide/markdown-editor
---

<script setup>
import EditorComponent from './components/EditorComponent.vue';
import JsonEditorComponent from './components/JsonEditorComponent.vue';
import MarkdownEditorComponent from './components/MarkdownEditorComponent.vue';
</script>

# Introduction

Welcome to the documentation for **On-Codemerge** v2 — a WYSIWYG editor built around a **JSON document** as source of truth. The toolbar, modals, and menus live in the **core SDK**. Plugins register commands and UI hooks via factory functions (`XPlugin()`).

<EditorComponent />

## Page chrome

Embed the editor as page content: sticky toolbar and footer stay hidden; click the document to open the **same toolbar** in a popup.

```ts
new Editor(host, {
  chrome: 'page',
  plugins: createDefaultPlugins(),
});
```

<EditorComponent chrome="page" :showDescription="false" />

## JSON Editor

Plain JSON Tree + Raw surface via **`on-codemerge/json`**: shell ViewPort + `JsonPlugin({ surface: 'workspace' })`. Same Editor construct pattern; interchange with `getText` / `setText`.

<JsonEditorComponent :showDescription="false" />

## Markdown Editor

Dual-pane Markdown via **`on-codemerge/markdown`**: shell ViewPort + `MarkdownPlugin({ surface: 'workspace' })`. Interchange with `getText` / `setText`.

<MarkdownEditorComponent :showDescription="false" />

## Getting Started

Three Editor products share the same kernel + SDK. Pick by document shape — full comparison: [Editors](/guide/editors).

### Installation

```bash
npm install --save on-codemerge
# or: yarn add on-codemerge / pnpm add on-codemerge / bun add on-codemerge
```

### 1. WYSIWYG (`on-codemerge`)

Prose document — HTML / Markdown / published interchange.

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins } from 'on-codemerge';

const editor = new Editor(document.getElementById('app')!, {
  plugins: createDefaultPlugins(),
});

await editor.setLocale('en');
editor.setHTML('<p>Your initial content here</p>');
editor.on('docChanged', () => {
  console.log(editor.getHTML());
  console.log(editor.getPublishedDocument());
});
```

### 2. JSON Editor (`on-codemerge/json`)

Plain JSON Tree + Raw — persist with `getText` / `setText`.

```ts
import 'on-codemerge/index.css';
import { Editor, createDefaultPlugins } from 'on-codemerge/json';

const editor = new Editor(document.getElementById('json-app')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('{"hello":true}');
editor.on('docChanged', () => {
  console.log(editor.getText());
});
```

### 3. Markdown Editor (`on-codemerge/markdown`)

Dual-pane source + preview — `getText` / `setText` and `getHTML` / `setHTML`.

```ts
import 'on-codemerge/index.css';
import { Editor, createDefaultPlugins } from 'on-codemerge/markdown';

const editor = new Editor(document.getElementById('md-app')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('# Hello\n\nFrom **Markdown**\n');
editor.on('docChanged', () => {
  console.log(editor.getText());
  console.log(editor.getHTML());
});
```

## Available Plugins

On-Codemerge ships with a full plugin ecosystem (tables, lists, media, collaboration, and more).

**[View all available plugins →](/plugins/)**

## Next Steps

- [Editors](/guide/editors) — WYSIWYG / JSON / Markdown, launch snippets
- [Editor API](/guide/editor) — JSON / HTML / Markdown / published
- [JSON Editor](/guide/json-editor) — Tree + Raw via `on-codemerge/json`
- [Markdown Editor](/guide/markdown-editor) — dual-pane via `on-codemerge/markdown`
- [JSON Plugin](/plugins/json-plugin) — embed atom + workspace options
- [Markdown Plugin](/plugins/markdown-plugin) — embed atom + workspace options
- [SDK reference](/guide/sdk) — `on-codemerge/sdk` public surface
- [Document model](/guide/document-model) — JSON document & operations
- [Authoring plugins](/guide/authoring-plugins) — `definePlugin`
- [Integrate](/integrate/) — React, Vue, Laravel, and more
