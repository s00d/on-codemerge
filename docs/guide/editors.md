# Editors

On-Codemerge ships **seven Editor products** on the same kernel + SDK. Pick by document shape.

Live demos: [Home](/).

|             | **WYSIWYG** (`on-codemerge`)                             | **JSON** (`on-codemerge/json`)         | **Markdown** (`on-codemerge/markdown`)                | **Code** (`on-codemerge/code`)              | **Forms** (`on-codemerge/forms`)              | **Charts** (`on-codemerge/charts`)       | **Calendar** (`on-codemerge/calendar`)     |
| ----------- | -------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------- | ------------------------------------------- | --------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| Package     | `on-codemerge`                                           | `on-codemerge/json`                    | `on-codemerge/markdown`                               | `on-codemerge/code`                         | `on-codemerge/forms`                          | `on-codemerge/charts`                    | `on-codemerge/calendar`                    |
| Document    | Prose JSON SoT (paragraphs, marks, atoms)                | Plain JSON tree SoT (`json` root)      | Prose JSON SoT (MD block subset: callout, mermaid, …) | Plain text SoT (`code_source`)              | FormConfig SoT (`form` root)                  | Chart attrs SoT (`chart` root)           | CalendarDoc SoT (`calendar` root)          |
| View        | ContentEditable + widgets                                | Shell + Tree / Raw                     | Shell + dual-pane (source + preview)                  | Shell + source editor                       | Shell + form studio                           | Shell + chart studio                     | Shell + calendar studio                    |
| Interchange | `getHTML` / `setHTML`, Markdown, publish                 | `getText` / `setText`                  | `getJSON` / `getText` / `getHTML` (+ set*)            | `getText` / `setText`                       | `getText` / `setText`                         | `getText` / `setText`                    | `getText` / `setText` (+ thin ICS)         |
| Plugin      | atom embeds (JSON / MD / Code / Form / Chart / Calendar) | `JsonPlugin({ surface: 'workspace' })` | `MarkdownPlugin({ surface: 'workspace' })`            | `CodeBlockPlugin({ surface: 'workspace' })` | `FormBuilderPlugin({ surface: 'workspace' })` | `ChartsPlugin({ surface: 'workspace' })` | `CalendarPlugin({ surface: 'workspace' })` |

## WYSIWYG

Rich document editor. Toolbar, lists, tables, media, **Insert →** JSON / Markdown / Code / Form / Chart / Calendar.

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

Lean set: `createCorePlugins()`. See [Editor API](/guide/editor) and [Plugins](/plugins/).

## JSON Editor

Tree + Raw for configuration / API payloads. No prose HTML.

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/json';

const editor = new Editor(document.getElementById('json-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('{"hello":true}');
```

See [JSON Editor](/guide/json-editor) and [JSON Plugin](/plugins/json-plugin).

## Markdown Editor

Dual-pane source + HTML preview. Mermaid blocks hydrate via a **simplified** `@codemerge/mermaid` subset — see [Mermaid](/guide/mermaid).

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/markdown';

const editor = new Editor(document.getElementById('md-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('# Hello\n');
```

See [Markdown Editor](/guide/markdown-editor) and [Markdown Plugin](/plugins/markdown-plugin).

## Code Editor

Single-pane source with line gutter and structural highlight (same contour as JSON Raw / Markdown source).

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/code';

const editor = new Editor(document.getElementById('code-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('const x = 1;\n');
```

See [Code Editor](/guide/code-editor) and [Code Block Plugin](/plugins/code-block-plugin).

## Forms Editor

Standalone form studio — palette, live preview, field inspector. SoT is `doc → form` with `attrs.schema` (`FormConfig`).

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/forms';

const editor = new Editor(document.getElementById('forms-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('{"id":"f1","method":"POST","action":"","fields":[]}');
```

See [Forms Editor](/guide/forms-editor) and [Form Builder Plugin](/plugins/form-builder-plugin).

## Charts Editor

Chart studio — Type / Data / Settings tabs, live preview. Most chart types render through `@codemerge/mermaid`; scatter/bubble use canvas.

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/charts';

const editor = new Editor(document.getElementById('charts-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText('{"chartType":"bar","title":"Chart","data":[],"width":800,"height":400}');
```

See [Charts Editor](/guide/charts-editor), [Charts Plugin](/plugins/charts-plugin), and [Mermaid](/guide/mermaid).

## Calendar Editor

Calendar studio — layers, month/week/day/year/agenda, event inspector. SoT is `doc → calendar` with `attrs.payload` (`CalendarDoc`).

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/calendar';

const editor = new Editor(document.getElementById('calendar-editor')!, {
  chrome: 'bar',
  plugins: createDefaultPlugins(),
});

editor.setText(
  '{"title":"Cal","tz":"UTC","view":"month","cursor":"2026-10-02","calendars":[{"id":"main","title":"Work","color":"#3b82f6","visible":true}],"events":[]}'
);
```

See [Calendar Editor](/guide/calendar-editor) and [Calendar Plugin](/plugins/calendar-plugin).
