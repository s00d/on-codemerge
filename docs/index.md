---
layout: home

hero:
  name: 'OnCodemerge Docs'
  text: 'Plugin-oriented virtual document editor'
  actions:
    - theme: brand
      text: Editor API
      link: /guide/editor
    - theme: alt
      text: Plugins
      link: /plugins/
    - theme: alt
      text: Integrate
      link: /integrate/
---

<script setup>
import EditorComponent from './components/EditorComponent.vue';
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

## Getting Started

### Installation

```bash
npm install --save on-codemerge
# or: yarn add on-codemerge / pnpm add on-codemerge / bun add on-codemerge
```

### Integration Example

```typescript
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', () => {
  void (async () => {
    const host = document.getElementById('app');
    if (!host) return;

    const editor = new Editor(host, {
      plugins: createDefaultPlugins(),
    });

    await editor.setLocale('en');

    editor.on('docChanged', () => {
      console.log(editor.getJSON());
    });

    // Boundaries (JSON is SoT):
    editor.setHTML('<p>Your initial content here</p>');
    console.log(editor.getHTML());
    editor.setMarkdown('# Hello\n\nFrom **Markdown**');
    console.log(editor.getMarkdown());
    console.log(editor.getPublishedDocument()); // full page HTML + public.css/js when needed
  })();
});
```

## Available Plugins

On-Codemerge ships with a full plugin ecosystem (tables, lists, media, collaboration, and more).

**[View all available plugins →](/plugins/)**

## Next Steps

- [Editor API](/guide/editor) — JSON / HTML / Markdown / published
- [SDK reference](/guide/sdk) — `on-codemerge/sdk` public surface
- [Document model](/guide/document-model) — JSON document & operations
- [Authoring plugins](/guide/authoring-plugins) — `definePlugin`
- [Integrate](/integrate/) — React, Vue, Laravel, and more
