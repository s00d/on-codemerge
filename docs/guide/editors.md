# Editors

On-Codemerge ships **seven Editor products** on the same kernel + SDK. Pick by document shape.

|             | **WYSIWYG** (`on-codemerge`)                             | **JSON** (`on-codemerge/json`)         | **Markdown** (`on-codemerge/markdown`)                | **Code** (`on-codemerge/code`)              | **Forms** (`on-codemerge/forms`)              | **Charts** (`on-codemerge/charts`)       | **Calendar** (`on-codemerge/calendar`)     |
| ----------- | -------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------- | ------------------------------------------- | --------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| Package     | `on-codemerge`                                           | `on-codemerge/json`                    | `on-codemerge/markdown`                               | `on-codemerge/code`                         | `on-codemerge/forms`                          | `on-codemerge/charts`                    | `on-codemerge/calendar`                    |
| Document    | Prose JSON SoT (paragraphs, marks, atoms)                | Plain JSON tree SoT (`json` root)      | Prose JSON SoT (MD block subset: callout, mermaid, …) | Plain text SoT (`code_source`)              | FormConfig SoT (`form` root)                  | Chart attrs SoT (`chart` root)           | CalendarDoc SoT (`calendar` root)          |
| View        | ContentEditable + widgets                                | Shell + Tree / Raw                     | Shell + dual-pane (source + preview)                  | Shell + source editor                       | Shell + form studio                           | Shell + chart studio                     | Shell + calendar studio                    |
| Interchange | `getHTML` / `setHTML`, Markdown, publish                 | `getText` / `setText`                  | `getJSON` / `getText` / `getHTML` (+ set*)            | `getText` / `setText`                       | `getText` / `setText`                         | `getText` / `setText`                    | `getText` / `setText` (+ thin ICS)         |
| Plugin      | atom embeds (JSON / MD / Code / Form / Chart / Calendar) | `JsonPlugin({ surface: 'workspace' })` | `MarkdownPlugin({ surface: 'workspace' })`            | `CodeBlockPlugin({ surface: 'workspace' })` | `FormBuilderPlugin({ surface: 'workspace' })` | `ChartsPlugin({ surface: 'workspace' })` | `CalendarPlugin({ surface: 'workspace' })` |

## WYSIWYG

Rich document editor. Toolbar, lists, tables, media, **Insert → JSON**, **Insert → Markdown**, **Insert → Code block**, **Insert → Form**, and **Insert → Chart**.

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
import JsonEditorComponent from '../components/JsonEditorComponent.vue';
import MarkdownEditorComponent from '../components/MarkdownEditorComponent.vue';
import CodeEditorComponent from '../components/CodeEditorComponent.vue';
import FormsEditorComponent from '../components/FormsEditorComponent.vue';
import ChartsEditorComponent from '../components/ChartsEditorComponent.vue';
import CalendarEditorComponent from '../components/CalendarEditorComponent.vue';
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

## Forms Editor

Standalone form studio — palette, live preview, field inspector. SoT is `doc → form` with `attrs.schema` (`FormConfig`).

<FormsEditorComponent :showDescription="false" />

### Launch

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/forms';

const editor = new Editor(document.getElementById('forms-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('{"id":"f1","method":"POST","action":"","fields":[]}');
editor.on('docChanged', () => {
  console.log(editor.getText());
});
```

See [Forms Editor](/guide/forms-editor) and [Form Builder Plugin](/plugins/form-builder-plugin).

## Charts Editor

Standalone chart studio — type, options, data table, live preview. SoT is `doc → chart`.

<ChartsEditorComponent :showDescription="false" />

### Launch

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/charts';

const editor = new Editor(document.getElementById('charts-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('{"chartType":"bar","title":"Chart","data":[],"width":800,"height":400}');
editor.on('docChanged', () => {
  console.log(editor.getText());
});
```

See [Charts Editor](/guide/charts-editor) and [Charts Plugin](/plugins/charts-plugin).

## Calendar Editor

Standalone calendar studio — layers, month/week/day/year/agenda, event inspector. SoT is `doc → calendar` with `attrs.payload` (`CalendarDoc`).

<CalendarEditorComponent :showDescription="false" />

### Launch

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/calendar';

const editor = new Editor(document.getElementById('calendar-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText(
  '{"title":"Cal","tz":"UTC","view":"month","cursor":"2026-10-02","calendars":[{"id":"main","title":"Work","color":"#3b82f6","visible":true}],"events":[]}'
);
editor.on('docChanged', () => {
  console.log(editor.getText());
});
```

See [Calendar Editor](/guide/calendar-editor) and [Calendar Plugin](/plugins/calendar-plugin).
