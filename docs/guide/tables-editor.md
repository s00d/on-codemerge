# Tables Editor

Grid product published as **`on-codemerge/tables`**. Thin app entry uses a shell ViewPort and **`TablePlugin({ surface: 'workspace' })`**, which mounts a custom grid engine (sort / filter / search / resize / selection / virtualization / pagination / clipboard / CSV) plus optional Raw JSON into `contentTarget`. Interchange via `getText` / `setText` (pretty `TableGridDoc` JSON).

WYSIWYG **Insert Table** stays a prose `table` / `tableRow` / `tableCell` tree — this product does not embed a spreadsheet atom in contenteditable.

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
| `getGrid()` / `setGrid(doc)` | Typed `{ version, columns, rows, view? }`                          |
| `getJSON()` / `setJSON(doc)` | Kernel document snapshot (`doc → tableGrid`)                       |
| `run` / `command` / `use`    | Same as WYSIWYG                                                    |
| `on('docChanged', …)`        | Subscriptions                                                      |
| `destroy()`                  | Tear down                                                          |

## Document shape (SoT v2)

SoT is `doc` → single `tableGrid` child. Payload in flat attrs (`columns`, `rows`, `view`, `version`):

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
  }[];
  view?: {
    sort?: { colId: string; dir: 'asc' | 'desc' }[];
    filters?: Record<string, { op: string; value: unknown }>;
    quickFilter?: string;
    columnOrder?: string[];
    pagination?: { page: number; pageSize: number };
    expandedRowIds?: string[];
    expandedGroupIds?: string[];
    groupBy?: string[];
  };
};
```

Legacy `{ columns, rows: string[][] }` is migrated on `parseText` / `normalizeTableGrid`.

## Toolbar & grid UX

`defaultTableToolbar()`: Grid / Raw, add row, Table menu (+col, Import URL, Export CSV, Search). Header click sorts; column edge drag resizes; row # selects; Ctrl/Cmd+C/V copies TSV; pagination footer; Raw Apply/Discard without monkey-patching `editor.run`.

## Local demo

```bash
pnpm dev:tables    # apps/tables SPA
pnpm build:tables  # → dist-tables/
```

## See also

- [Editors](./editors.md) — product matrix
- [Table Plugin](/plugins/table-plugin) — atom + workspace options
- [Editor API](./editor.md) — WYSIWYG entry (`on-codemerge`)
