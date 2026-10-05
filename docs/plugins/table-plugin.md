# Table Plugin

Structural tables plus **lazy tables** that fetch JSON/CSV from a URL and fill the model.

## Features

- **Table Creation**: Insert tables with custom rows and columns
- **Table Editing**: Add/remove rows and columns, merge/split cells
- **Table Styling**: Themes via context menu (`tableStyle`)
- **Lazy Loading**: Fetch remote JSON/CSV into a table (`lazyUrl` / `lazyFormat`)
- **Context Menu**: Right-click for structure, import/export, lazy load/edit/refresh
- **Keyboard**: `Mod-Shift-t` insert table; `Mod-Shift-u` insert lazy table; `Mod-Alt-k` edit lazy

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor } from 'on-codemerge';
import { TablePlugin } from 'on-codemerge/plugins';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(container, {
  plugins: [TablePlugin()],
});
```

### Surfaces

```ts
TablePlugin({
  surface: 'workspace' | 'atom', // default 'atom'
  toolbar?: TableToolbarOptions, // workspace bar; omit → defaultTableToolbar()
  menu?: string | null,          // atom Insert placement
});
```

`createDefaultPlugins()` (from `on-codemerge/tables`) = `TablePlugin({ surface: 'workspace' })` — grid JSON SoT (`doc → tableGrid`), not a prose tree. Workspace requires a `doc → tableGrid` seed: pass `emptyEditorDoc()` from `on-codemerge/tables` (the tables `Editor` defaults this); bare `TablePlugin({ surface: 'workspace' })` on a prose/default doc throws.

`surface: 'atom'` (WYSIWYG default) inserts the **same sheet** as a `tableGrid` atom widget. HTML/Markdown `<table>` imports as `tableGrid`.

Legacy `rows: string[][]` documents migrate to `{ id, cells }` on parse.

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['TablePlugin']"
  :showDescription="false"
  :showResults="false"
/>

## API Reference

### Atom commands (WYSIWYG)

| Command           | Behavior                                                    |
| ----------------- | ----------------------------------------------------------- |
| `insertTable`     | Size picker → `tableGrid` atom (`Mod-Shift-t`)              |
| `insertLazyTable` | URL popup, empty sheet + `source`, autoload (`Mod-Shift-u`) |
| `editLazyTable`   | Edit `source` on the selected sheet (`Mod-Alt-k`)           |
| `fillTable`       | Re-fetch `source`                                           |

Row/column/cell edits run inside the sheet (click cells, header `+`, context menu) — not as prose `tableRow` commands.

```javascript
editor.command('insertTable');
editor.command('insertLazyTable');
```

Toolbar: **Insert → Table** / **Lazy Table**. Sheet context menu: add/delete column, format, source.

### Workspace sheet source

On `tableGrid` (tables editor), the same fetch path (`fetchLazyMatrix`) is stored as `source`:

```ts
source?: { url: string; format: 'json' | 'csv'; headers?: boolean; delimiter?: string }
```

| Command               | Behavior                                 |
| --------------------- | ---------------------------------------- |
| `table.importUrl`     | Import JSON/CSV from URL (`Mod-Shift-u`) |
| `table.editSource`    | Edit source URL and reload (`Mod-Alt-k`) |
| `table.refreshSource` | Re-fetch current `source.url`            |

Toolbar Table menu: **Import URL / Refresh data / Edit source…**. Context menu repeats those items. Autoload runs once per URL on mount/`update`. Atom lazy tables are unchanged (`lazyUrl` on `table`).

### Lazy attrs (JSON model)

Stored on the `table` node:

- `lazyUrl` — http(s) data URL
- `lazyFormat` — `json` | `csv`
- `lazyHeaders` — treat first row as header (default `true`)
- `lazyDelimiter` — CSV delimiter (default `,`)

### Supported payloads

**JSON**

- Array of objects → header from keys + rows
- Array of arrays → rectangular matrix
- `{ headers: string[], rows: unknown[][] }`

**CSV** — delimiter-separated rows (quoted fields supported)

### HTML round-trip

Export is `gridToHtml`. Default **stretch** (`view.fit: fill`) emits `html-editor-table--fill` and `width:100%`. **Fixed** (`content`) emits stored px widths as `html-editor-table--content`. Import maps any HTML `<table>` (and GFM tables) onto `tableGrid` and restores fill/content from those classes.

```html
<table class="html-editor-table html-editor-table--sheet">
  <thead>
    <tr>
      <th>Name</th>
      <th>Qty</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Apples</td>
      <td>3</td>
    </tr>
  </tbody>
</table>
```

Insert a sheet: `editor.run(insertAtomAfter('tableGrid', attrsFromGrid(sizedEmptyGrid(3, 3, true))))`.

## Notes

- Fetch uses `credentials: 'omit'` and only allows `http:` / `https:` URLs.
- CORS must allow the editor origin for remote APIs.
