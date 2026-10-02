# Charts Editor

Chart studio product published as **`on-codemerge/charts`**. Thin app entry uses a shell ViewPort and **`ChartsPlugin({ surface: 'workspace' })`**, which mounts the shared chart studio into `contentTarget`. Interchange via `getText` / `setText` (chart attrs JSON).

<script setup>
import ChartsEditorComponent from '../components/ChartsEditorComponent.vue';
</script>

<ChartsEditorComponent :showDescription="false" />

## Install

```bash
npm install --save on-codemerge
```

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/charts';

const host = document.getElementById('charts-editor')!;
const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // HistoryChrome + ChartsPlugin({ surface: 'workspace' })
});

editor.on('docChanged', () => {
  console.log(editor.getText());
});

editor.setText('{"chartType":"bar","title":"Chart","data":[],"width":800,"height":400}');
editor.destroy();
```

`createView` defaults to `createShellView`. Local SPA: `pnpm dev:charts`.

### Same plugin in WYSIWYG

```ts
import { Editor, createDefaultPlugins, ChartsPlugin } from 'on-codemerge';

new Editor(host, {
  plugins: [
    ...createDefaultPlugins(), // includes ChartsPlugin({ surface: 'atom' })
  ],
});
```

`surface: 'atom'` opens the same `mountChartWorkspace` studio in an `lg` popup. Hotkey `Mod-Alt-g` **opens the studio** (does not silent-insert). See [Charts Plugin](/plugins/charts-plugin) and [Editors](/guide/editors).

### Types

Published types for `on-codemerge/charts` expect TypeScript `moduleResolution: "bundler"` (or `skipLibCheck: true`).

## Document API

| Method                       | Role                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| `getText()`                  | Pretty chart attrs JSON                                            |
| `setText(text)`              | Replace SoT; returns `ParseError \| null` (SoT unchanged on error) |
| `getJSON()` / `setJSON(doc)` | Kernel document snapshot (`doc → chart`)                           |
| `run` / `command` / `use`    | Same as WYSIWYG                                                    |
| `on('docChanged', …)`        | Subscriptions                                                      |
| `destroy()`                  | Tear down                                                          |

## Document shape

SoT is `doc` → single `chart` child. Attrs hold `chartType`, `data`, title, axes, legend, grid, size, mode, orientation.

## Toolbar

`createDefaultPlugins()` ships **HistoryChrome** (undo/redo). Chart type lives in the studio (`defaultChartToolbar()` is empty). Customize via `toolbar` / `createDefaultPlugins({ toolbar })`.

## Local demo

```bash
pnpm dev:charts    # apps/charts SPA
pnpm build:charts  # → dist-charts/
```

## See also

- [Editors](./editors.md) — product matrix
- [Charts Plugin](/plugins/charts-plugin) — atom + workspace options
- [Editor API](./editor.md) — WYSIWYG entry (`on-codemerge`)
