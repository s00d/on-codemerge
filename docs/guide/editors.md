# Editors

On-Codemerge ships **four Editor products** on the same kernel + SDK. Pick by document shape.

|             | **WYSIWYG** (`on-codemerge`)                | **JSON** (`on-codemerge/json`)         | **Markdown** (`on-codemerge/markdown`)                | **Code** (`on-codemerge/code`)              |
| ----------- | ------------------------------------------- | -------------------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| Package     | `on-codemerge`                              | `on-codemerge/json`                    | `on-codemerge/markdown`                               | `on-codemerge/code`                         |
| Document    | Prose JSON SoT (paragraphs, marks, atoms)   | Plain JSON tree SoT (`json` root)      | Prose JSON SoT (MD block subset: callout, mermaid, …) | Plain text SoT (`code_source`)              |
| View        | ContentEditable + widgets                   | Shell + Tree / Raw                     | Shell + dual-pane (source + preview)                  | Shell + source editor                       |
| Interchange | `getHTML` / `setHTML`, Markdown, publish    | `getText` / `setText`                  | `getJSON` / `getText` / `getHTML` (+ set*)            | `getText` / `setText`                       |
| Plugin      | `JsonPlugin` / `MarkdownPlugin` atom embeds | `JsonPlugin({ surface: 'workspace' })` | `MarkdownPlugin({ surface: 'workspace' })`            | `CodeBlockPlugin({ surface: 'workspace' })` |

## WYSIWYG

Rich document editor. Toolbar, lists, tables, media, **Insert → JSON**, **Insert → Markdown**, and **Insert → Code block**.

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
import JsonEditorComponent from '../components/JsonEditorComponent.vue';
import MarkdownEditorComponent from '../components/MarkdownEditorComponent.vue';
import CodeEditorComponent from '../components/CodeEditorComponent.vue';
</script>

<EditorComponent :showDescription="false" />

### Launch

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins } from 'on-codemerge';

const editor = new Editor(document.getElementById('editor')!, {
  plugins: createDefaultPlugins(),
});

await editor.setLocale('en');
editor.setHTML('<p>Hello</p>');
editor.on('docChanged', () => {
  console.log(editor.getHTML());
});
```

Lean set: `createCorePlugins()`. Single plugins: `new Editor(host, { plugins: [ToolbarPlugin(), ListsPlugin()] })`.

See [Editor API](/guide/editor) and [Plugins](/plugins/).

## JSON Editor

Tree + Raw for configuration / API payloads. No prose HTML.

<JsonEditorComponent :showDescription="false" />

### Launch

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/json';

const editor = new Editor(document.getElementById('json-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('{"hello":true}');
editor.on('docChanged', () => {
  console.log(editor.getText());
});
```

See [JSON Editor](/guide/json-editor) and [JSON Plugin](/plugins/json-plugin).

## Markdown Editor

Dual-pane source + HTML preview projected from prose JSON SoT. Mermaid hosts hydrate to inline SVG (`data-node="mermaid"`).

<MarkdownEditorComponent :showDescription="false" />

### Launch

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/markdown';

const editor = new Editor(document.getElementById('md-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('# Hello\n');
editor.on('docChanged', () => {
  console.log(editor.getText());
  console.log(editor.getHTML());
});
```

See [Markdown Editor](/guide/markdown-editor) and [Markdown Plugin](/plugins/markdown-plugin).

## Code Editor

Single-pane source editor with line gutter and universal structural highlight (same contour as JSON Raw / Markdown source).

<CodeEditorComponent :showDescription="false" />

### Launch

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/code';

const editor = new Editor(document.getElementById('code-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('const x = 1;\n');
editor.on('docChanged', () => {
  console.log(editor.getText());
});
```

See [Code Editor](/guide/code-editor) and [Code Block Plugin](/plugins/code-block-plugin).

## Same construct pattern

All apps use `new Editor(host, { plugins, chrome?, doc? })`. Differences are the **entry package**, **default plugins / ViewPort**, and **IO methods**. Do not mount `surface: 'workspace'` on a prose CE host — it requires a shell content target and the matching SoT (`emptyEditorDoc()`).
