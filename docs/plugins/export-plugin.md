# Export Plugin

Toolbar menu to download the current document. Formats map onto the same Editor boundaries as the public API — no parallel serializer.

> Install and CSS: [Editor API — Getting Started](/guide/editor#getting-started). Boundaries: [JSON / HTML / Markdown / published](/guide/editor#boundaries-json-vs-html-vs-markdown-vs-published).

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ExportPlugin']" />

## Usage

```ts
import { Editor, ExportPlugin, createDefaultPlugins } from 'on-codemerge';

const editor = new Editor(host, {
  plugins: [...createDefaultPlugins()], // or ExportPlugin() alone + essentials
});

editor.command('exportDoc'); // opens format menu
```

## Public API (v2)

Factory: `ExportPlugin()`.

| Command     |                       |
| ----------- | --------------------- |
| `exportDoc` | Opens the export menu |

| Shortcut    | Command     |
| ----------- | ----------- |
| `Mod-Alt-e` | `exportDoc` |

No factory options. There is no `editor.exportTo*` — the menu calls `ExportService` with the live `EditorAPI`.

## Formats

| Menu id    | Output          | Source                                   |
| ---------- | --------------- | ---------------------------------------- |
| `html`     | `document.html` | `editor.getPublishedDocument()`          |
| `markdown` | `document.md`   | `editor.getMarkdown()`                   |
| `text`     | `document.txt`  | plain text from `getHTML()`              |
| `pdf`      | print dialog    | `getPublishedDocument()` → browser print |

Programmatic equivalent without the menu:

```ts
import { downloadBlob } from 'on-codemerge/sdk';

downloadBlob(editor.getMarkdown(), 'document.md', 'text/markdown');
downloadBlob(editor.getPublishedDocument(), 'document.html', 'text/html');
```

Headless (no Editor): `exportMarkdown(doc)` / `exportHTML(doc)` from `on-codemerge` — see [Editor API — Headless IO](/guide/editor#headless-io-no-editor-instance).

## Related

- [Editor API](/guide/editor) — `getMarkdown`, `getPublishedDocument`
- [SDK reference](/guide/sdk) — `downloadBlob`, `composePublishedDocument`
