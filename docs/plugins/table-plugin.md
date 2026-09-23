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
import { Editor, TablePlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(container, {
  plugins: [TablePlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['TablePlugin']" />

## API Reference

### Structural commands

| Command                                       | Behavior                         |
| --------------------------------------------- | -------------------------------- |
| `insertTable`                                 | Insert 3×3 table (`Mod-Shift-t`) |
| `deleteTable`                                 | Remove table                     |
| `addRowBelow` / `addRowAbove`                 | Insert row                       |
| `addColumnLeft` / `addColumnRight`            | Insert column                    |
| `deleteRow` / `deleteColumn`                  | Remove row/column                |
| `clearCell` / `clearTable`                    | Clear contents                   |
| `addHeaderRow` / `removeHeaderRow`            | Header row                       |
| `mergeCellsHorizontal` / `mergeCellsVertical` | Merge                            |
| `splitCell`                                   | Split horizontally               |

```javascript
editor.command('insertTable');
editor.command('addRowBelow');
```

### Lazy table commands

| Command           | Behavior                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| `insertLazyTable` | Opens URL/format popup, inserts table, fetches and fills (`Mod-Shift-u`) |
| `editLazyTable`   | Edit URL/format on the selected lazy table and reload (`Mod-Alt-k`)      |
| `fillTable`       | Re-fetch using current `lazyUrl` / `lazyFormat` attrs                    |

```javascript
editor.command('insertLazyTable');
editor.command('editLazyTable');
editor.command('fillTable');
```

Toolbar: **Insert → Lazy Table**. Context menu → **More → Lazy Table… / Edit Lazy Table… / Refresh Lazy Data**.

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

Export writes `data-lazy-url`, `data-lazy-format`, `data-lazy-headers`, optional `data-lazy-delimiter`. Import restores those attrs. On load, tables with `lazyUrl` auto-fetch once.

```html
<table
  class="html-editor-table"
  data-lazy-url="https://api.example.com/data.json"
  data-lazy-format="json"
  data-lazy-headers="true"
>
  …
</table>
```

## Notes

- Fetch uses `credentials: 'omit'` and only allows `http:` / `https:` URLs.
- CORS must allow the editor origin for remote APIs.
- Prefer custom sizes via `editor.run(insertTableCommand(rows, cols, hasHeader))` from table helpers.
