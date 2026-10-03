# Charts Editor

Chart studio product published as **`on-codemerge/charts`**. Thin app entry uses a shell ViewPort and **`ChartsPlugin({ surface: 'workspace' })`**, which mounts the shared chart studio into `contentTarget`. Interchange via `getText` / `setText` (chart attrs JSON).

<script setup>
import ChartsEditorComponent from '../components/ChartsEditorComponent.vue';
</script>

<ChartsEditorComponent :showDescription="false" />

## Studio layout

Left pane (50%) + right live preview (50%):

| Area         | Contents                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title        | Always visible above tabs — rename without leaving Type/Data                                                                                                        |
| **Type**     | Chart type grid + template picker                                                                                                                                   |
| **Data**     | Series / points table (auto-opens after picking a type)                                                                                                             |
| **Settings** | Axis labels; mode (bar/area). Legend / grid only for scatter & bubble (canvas). Mermaid-backed types ignore legend/grid/orientation — see [Mermaid](/guide/mermaid) |
| Preview      | Fills the right pane; re-renders on resize                                                                                                                          |
| Toolbar      | Undo / redo + **Export as PNG** (`defaultChartToolbar`)                                                                                                             |

Narrow viewports: Preview / Edit studio tabs (`studioPaneTabs`).

## Render path

- Bar, line, area, pie, doughnut, radar, … → `@codemerge/mermaid` (`toMermaidSource` → `render`). This is a **Mermaid subset**, not full Mermaid.js — see [Mermaid](/guide/mermaid).
- Scatter / bubble → small canvas paint path.

## Install

```bash
npm install --save on-codemerge
```

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge/charts';

const host = document.getElementById('charts-editor')!;
const editor = new Editor(host, {
  chrome: 'bar',
  plugins: createDefaultPlugins(), // ChartsPlugin({ surface: 'workspace' }) + export toolbar
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
import { Editor, createDefaultPlugins } from 'on-codemerge';

new Editor(host, {
  plugins: [...createDefaultPlugins()], // includes ChartsPlugin({ surface: 'atom' })
});
```

`surface: 'atom'` opens the same `mountChartWorkspace` studio in an `lg` popup. Hotkey `Mod-Alt-g` **opens the studio** (does not silent-insert). PNG export: chart context menu. See [Charts Plugin](/plugins/charts-plugin).

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

SoT is `doc` → single `chart` child. Attrs: `chartType`, `data`, title, axes, legend, grid, size, mode, orientation.

## Toolbar

Undo/redo from the editor kernel. Workspace adds Export PNG via `defaultChartToolbar()` (override with `createDefaultPlugins({ toolbar })`).

## Local demo

```bash
pnpm dev:charts    # apps/charts SPA
pnpm build:charts  # → dist-charts/
```

## See also

- [Charts Plugin](/plugins/charts-plugin)
- [Mermaid](/guide/mermaid)
- [Editors](/guide/editors)
