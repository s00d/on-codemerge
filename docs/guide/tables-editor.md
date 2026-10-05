# Tables Editor

Grid product published as **`on-codemerge/tables`**. Thin app entry uses a shell ViewPort and **`TablePlugin({ surface: 'workspace' })`**, which mounts a custom grid engine (sparse Excel-like sheet, sort / filter / search / resize / selection / virtualization / clipboard / CSV, optional remote `source`) plus optional Raw JSON into `contentTarget`. Interchange via `getText` / `setText` (pretty `TableGridDoc` JSON) and `getHTML()` (used SoT as `<table>`).

WYSIWYG **Insert Table** mounts the same `tableGrid` sheet as an in-document atom (`TablePlugin({ surface: 'atom' })`). HTML/Markdown still interchange as `<table>` / GFM. A constrained Tables product (`on-codemerge/tables`) uses the sheet as the whole document.

**Stretch** (default) fills the editor width and `getHTML()` uses `width:100%`. **Fixed** keeps stored column widths in both the grid and the HTML preview. Toggle on the toolbar or the status chip.

<script setup>
import TablesEditorComponent from '../components/TablesEditorComponent.vue';
</script>

<TablesEditorComponent :showDescription="false" />

## Install

```bash
npm install --save on-codemerge
```

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/tables';

const host = document.getElementById('tables-editor')!;
const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // TablePlugin({ surface: 'workspace' })
});

editor.on('docChanged', () => {
  console.log(editor.getText());
});

editor.setText(`{
  "version": 2,
  "columns": [{ "id": "a", "title": "A", "type": "text" }],
  "rows": [{ "id": "r1", "cells": { "a": "" } }]
}`);
editor.destroy();
```

`createView` defaults to `createShellView`. Local SPA: `pnpm dev:tables`.

### Same plugin in WYSIWYG

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge';

new Editor(host, {
  plugins: [
    ...createDefaultPlugins(), // includes TablePlugin({ surface: 'atom' })
  ],
});
```

`surface: 'atom'` is the existing prose table (insert popup, context menu, lazy autoload). Hotkeys `Mod-Shift-t` / `Mod-Shift-u`. See [Table Plugin](/plugins/table-plugin) and [Editors](/guide/editors).

### Types

Published types for `on-codemerge/tables` expect TypeScript `moduleResolution: "bundler"` (or `skipLibCheck: true`).

## Document API

| Method                       | Role                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `getText()`                  | Pretty `TableGridDoc` JSON                                         |
| `setText(text)`              | Replace SoT; returns `ParseError \| null` (SoT unchanged on error) |
| `getHTML()`                  | Used SoT as `<table class="html-editor-table">` (no ghost cells)   |
| `getGrid()` / `setGrid(doc)` | Typed `{ version, columns, rows, view?, source? }`                 |
| `getJSON()` / `setJSON(doc)` | Kernel document snapshot (`doc → tableGrid`)                       |
| `run` / `command` / `use`    | Same as WYSIWYG                                                    |
| `on('docChanged', …)`        | Subscriptions                                                      |
| `destroy()`                  | Tear down                                                          |

## Document shape (SoT v2)

SoT is `doc` → single `tableGrid` child. Payload in flat attrs (`columns`, `rows`, `view`, `version`, `source`):

```ts
type TableGridDoc = {
  version: 2;
  columns: {
    id: string;
    title: string;
    width?: number;
    pinned?: 'left' | 'right' | null;
    type?: 'text' | 'number' | 'boolean';
  }[];
  rows: {
    id: string;
    cells: Record<string, string | number | boolean | null>;
    parentId?: string | null;
    styles?: Record<
      string,
      {
        align?: 'left' | 'center' | 'right';
        background?: string;
        color?: string;
        border?: 'none' | 'thin' | 'medium' | 'thick';
      }
    >;
  }[];
  view?: {
    sort?: { colId: string; dir: 'asc' | 'desc' }[];
    filters?: Record<string, { op: string; value: unknown }>;
    quickFilter?: string;
    columnOrder?: string[];
    expandedRowIds?: string[];
    expandedGroupIds?: string[];
    groupBy?: string[];
    fit?: 'fill' | 'content';
    rowHeight?: number;
  };
  source?: { url: string; format: 'json' | 'csv'; headers?: boolean; delimiter?: string };
};
```

JSON stores only used rows/columns. Extra columns appear only via Add column (toolbar, header `+`, or paste). Empty rows below are a visual canvas (`sheetRows`); click / F2 on an empty row materializes SoT. Scroll near the bottom grows that canvas (cap 2000) without writing empty rows.

Legacy `{ columns, rows: string[][] }` is migrated on `parseText` / `normalizeTableGrid`.

## Toolbar & grid UX

`defaultTableToolbar()`: Grid / Raw, add row, Table menu (+col, Format cell, Import URL, Refresh data, Edit source, Export CSV, Search). One-line column header (title left, ← → pin right); header click sorts; column edge drag resizes; row # selects; Ctrl/Cmd+C/V copies TSV. Status shows used row count and source host when `source.url` is set. `Mod-Shift-u` import URL, `Mod-Alt-k` edit source. Raw Apply/Discard without monkey-patching `editor.run`.

## Local demo

```bash
pnpm dev:tables    # apps/tables SPA
pnpm build:tables  # → dist-tables/
```

## See also

- [Editors](./editors.md) — product matrix
- [Table Plugin](/plugins/table-plugin) — atom + workspace options
- [Editor API](./editor.md) — WYSIWYG entry (`on-codemerge`)
