# Charts Plugin

Insert and edit chart atoms in WYSIWYG, or run the full studio as **`on-codemerge/charts`**.

> Install / CSS: [Editor API](/guide/editor#getting-started).  
> Standalone app: [Charts Editor](/guide/charts-editor) · surfaces: [Editors](/guide/editors) · diagrams: [Mermaid](/guide/mermaid).

## Surfaces

```ts
import { Editor, ChartsPlugin } from 'on-codemerge';

new Editor(host, {
  plugins: [ChartsPlugin()], // surface: 'atom' (default)
});

// Standalone Charts app:
// ChartsPlugin({ surface: 'workspace', toolbar?: ChartToolbarOptions })
```

| Option                           | Role                                                              |
| -------------------------------- | ----------------------------------------------------------------- |
| `surface: 'atom' \| 'workspace'` | Atom popup studio (default) vs shell workspace                    |
| `toolbar`                        | Workspace bar items; default `defaultChartToolbar()` (Export PNG) |
| `menu` / `group` / `order`       | Atom Insert placement                                             |

`createDefaultPlugins()` from `on-codemerge/charts` = workspace + default export toolbar.

## Demo (atom)

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['ChartsPlugin']"
  :showDescription="false"
  :showResults="false"
/>

## Studio

Shared `mountChartWorkspace` UI for atom popup and Charts editor:

1. **Title** — sticky above tabs
2. **Type** — chart type + templates
3. **Data** — series table (selected after type pick)
4. **Settings** — axes; mode (bar/area); legend/grid for scatter & bubble only (mermaid types ignore them)
5. **Preview** — live render; workspace Export PNG lives on the editor toolbar

## Commands

```ts
editor.command('insertChart'); // Mod-Alt-g — opens studio (does not silent-insert)
```

Atom: edit / resize / PNG export / delete from the chart **context menu**. No separate `updateChart` / `exportChart` commands.

```ts
editor.on('docChanged', () => {});
```

## HTML boundary

Persisted atoms use `data-node="chart"`:

```html
<div
  data-node="chart"
  data-chart-type="bar"
  data-data='[{"name":"Series 1","data":[{"label":"A","value":3}]}]'
  data-title="Sales"
  data-width="800"
  data-height="400"
  data-show-legend="true"
  data-show-grid="true"
  data-mode="default"
  data-orientation="vertical"
></div>
```

| Attr               | Notes                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| `data-chart-type`  | `bar` \| `line` \| `area` \| `radar` \| `pie` \| `doughnut` \| `scatter` \| `bubble` |
| `data-data`        | JSON series array                                                                    |
| `data-mode`        | `default` \| `grouped` \| `stacked` (bar/area drivers)                               |
| `data-orientation` | `vertical` \| `horizontal` when supported                                            |

## Render

| Types                                    | Engine                                                       |
| ---------------------------------------- | ------------------------------------------------------------ |
| bar, line, area, pie, doughnut, radar, … | `@codemerge/mermaid` subset via `toMermaidSource` → `render` |
| scatter, bubble                          | Canvas                                                       |

Mermaid here is **not** full Mermaid.js — see [Mermaid](/guide/mermaid).

## Data shape

```ts
type ChartSeries = {
  name: string;
  color?: string;
  data: Array<{ label: string; value: number; color?: string }>;
};
```

Scatter/bubble points use `x` / `y` / `r` instead of `label` / `value` (driver coerce).

## See also

- [Charts Editor](/guide/charts-editor)
- [Mermaid](/guide/mermaid)
- [SDK](/guide/sdk) — `studioPaneTabs` / `syncStudioPanel`
