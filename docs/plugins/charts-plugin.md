# Charts Plugin

The Charts Plugin provides comprehensive chart creation and management capabilities for the on-CodeMerge editor, supporting multiple chart types with interactive features and data visualization.

## Features

- **Multiple Chart Types**: Bar, Line, Pie, Doughnut, Area, Radar, Scatter, and Bubble charts
- **Interactive Charts**: Click to resize, context menu for edit / PNG export / delete
- **Data Management**: Modal data editor (single- and multi-series)
- **Chart Customization**: Title, axes, legend, grid, mode, orientation
- **Export Support**: Export chart as PNG from the context menu
- **HTML Boundary**: Persist via `data-node="chart"` attrs in `getHTML` / `setHTML`

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, ChartsPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(container, {
  plugins: [ChartsPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ChartsPlugin']" />

## API Reference

### Commands

```javascript
// Opens the chart modal (toolbar Insert → Chart). Hotkey: Mod-Alt-g
editor.command('insertChart');
```

Edit, resize, and PNG export are available from the chart context menu (right-click the chart widget). There are no separate `updateChart` / `resizeChart` / `exportChart` commands.

Document changes are observed via:

```javascript
editor.on('docChanged', () => {});
editor.on('selectionChanged', () => {});
```

### HTML boundary (`getHTML` / `setHTML`)

Persisted chart atoms use `data-node="chart"` (not the live widget class `.chart-container`):

```html
<div
  data-node="chart"
  data-chart-type="bar"
  data-data='[{"name":"Series 1","data":[{"label":"A","value":3}]}]'
  data-title="Chart"
  data-width="800"
  data-height="400"
  data-show-legend="true"
  data-show-grid="true"
  data-mode="default"
  data-orientation="vertical"
></div>
```

## Supported Chart Types

### Bar Chart

- **Type**: `bar`
- **Supports Multiple Series**: Yes (default / stacked / grouped)
- **Best For**: Comparing categories, discrete data
- **Data Format**: One or more series with labels and values

```javascript
const barData = [
  {
    name: 'Sales',
    data: [
      { label: 'Q1', value: 100 },
      { label: 'Q2', value: 150 },
      { label: 'Q3', value: 200 },
      { label: 'Q4', value: 180 },
    ],
  },
];
```

### Line Chart

- **Type**: `line`
- **Supports Multiple Series**: Yes
- **Best For**: Trends over time, continuous data
- **Data Format**: Multiple series with labels and values

```javascript
const lineData = [
  {
    name: 'Revenue',
    data: [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 150 },
      { label: 'Mar', value: 200 },
    ],
    color: '#3b82f6',
  },
  {
    name: 'Expenses',
    data: [
      { label: 'Jan', value: 80 },
      { label: 'Feb', value: 120 },
      { label: 'Mar', value: 160 },
    ],
    color: '#ef4444',
  },
];
```

### Pie Chart

- **Type**: `pie`
- **Supports Multiple Series**: No
- **Best For**: Proportions, percentages
- **Data Format**: Single series with labels and values

```javascript
const pieData = [
  {
    name: 'Market Share',
    data: [
      { label: 'Product A', value: 40 },
      { label: 'Product B', value: 30 },
      { label: 'Product C', value: 20 },
      { label: 'Product D', value: 10 },
    ],
  },
];
```

### Doughnut Chart

- **Type**: `doughnut`
- **Supports Multiple Series**: No
- **Best For**: Proportions with center space
- **Data Format**: Single series with labels and values

### Area Chart

- **Type**: `area`
- **Supports Multiple Series**: Yes
- **Best For**: Cumulative data, filled trends
- **Data Format**: Multiple series with labels and values

### Radar Chart

- **Type**: `radar`
- **Supports Multiple Series**: Yes
- **Best For**: Multi-dimensional data, comparisons
- **Data Format**: Multiple series with labels and values

### Scatter Plot

- **Type**: `scatter`
- **Supports Multiple Series**: Yes
- **Requires XY Data**: Yes
- **Best For**: Correlation analysis, distribution
- **Data Format**: Multiple series with x, y coordinates

```javascript
const scatterData = [
  {
    name: 'Dataset 1',
    data: [
      { label: 'Point 1', x: 10, y: 20 },
      { label: 'Point 2', x: 15, y: 25 },
      { label: 'Point 3', x: 20, y: 30 },
    ],
  },
];
```

### Bubble Chart

- **Type**: `bubble`
- **Supports Multiple Series**: Yes
- **Requires XY Data**: Yes
- **Best For**: Three-dimensional data visualization
- **Data Format**: Multiple series with x, y, and size values

## Keyboard Shortcuts

| Shortcut     | Description  | Command       |
| ------------ | ------------ | ------------- |
| `Ctrl+Alt+G` | Insert chart | `insertChart` |

## Context Menu

Right-click a chart:

- **Edit Chart** — open the chart modal
- **Export Chart** — download PNG
- **Delete Chart** — remove the atom

Resize handles appear after clicking the chart. There is no duplicate / import-data / theme picker in the menu today.

## Chart Data Structure

### ChartDataPoint

```typescript
interface ChartDataPoint {
  label: string;
  value: number;
}
```

### ChartSeries

```typescript
interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}
```

### ChartData

```typescript
type ChartData = ChartSeries | ChartDataPoint;
```

## Events

Use `editor.on('docChanged' | 'selectionChanged', …)` only.

## Examples

### Basic Bar Chart

```html
<div
  data-node="chart"
  data-chart-type="bar"
  data-data='[{"name":"S","data":[{"label":"A","value":1}]}]'
  data-title="Chart"
  data-width="800"
  data-height="400"
></div>
```

### Multi-Series Line Chart

```html
<div
  data-node="chart"
  data-chart-type="bar"
  data-data='[{"name":"S","data":[{"label":"A","value":1}]}]'
  data-title="Chart"
  data-width="800"
  data-height="400"
></div>
```

### Pie Chart

```html
<div
  data-node="chart"
  data-chart-type="bar"
  data-data='[{"name":"S","data":[{"label":"A","value":1}]}]'
  data-title="Chart"
  data-width="800"
  data-height="400"
></div>
```

### Scatter Plot

```html
<div
  data-node="chart"
  data-chart-type="bar"
  data-data='[{"name":"S","data":[{"label":"A","value":1}]}]'
  data-title="Chart"
  data-width="800"
  data-height="400"
></div>
```

## Chart Customization

### Themes

```javascript
// Apply different themes
const chartOptions = {
  theme: 'dark', // or 'light', 'blue', 'green', etc.
  colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
};
```

### Styling

```css
/* Custom chart styles */
.chart-container {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
}

.chart-container:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { Editor, ChartsPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new Editor(editorRef.current);
      // v2: pass ChartsPlugin() in Editor constructor plugins: [...]
    }

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
      }
    };
  }, []);

  return <div ref={editorRef} className="editor-container" />;
}
```

### Vue Integration

```vue
<template>
  <div ref="editorContainer" class="editor-container"></div>
</template>

<script>
import { Editor, ChartsPlugin } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new Editor(this.$refs.editorContainer);
    this.// use plugins: [ChartsPlugin()];
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
};
</script>
```

## Data Import/Export

### Import Data

```javascript
// Import from JSON
const jsonData = `[
  {
    "name": "Sales",
    "data": [
      {"label": "Jan", "value": 100},
      {"label": "Feb", "value": 150},
      {"label": "Mar", "value": 200}
    ]
  }
]`;
```

### Export Data

````javascript
// Export chart data
const data =
// Export chart as image
const imageData = ```

## Troubleshooting

### Common Issues

1. **Charts not rendering**
   - Check if chart library is loaded
   - Verify data format is correct
   - Check browser console for errors

2. **Data not displaying**
   - Ensure data structure matches chart type
   - Check for missing required fields
   - Verify data values are numbers

3. **Charts not resizing**
   - Check if Resizer component is initialized
   - Verify chart container has proper dimensions
   - Ensure no conflicting CSS styles

4. **Context menu not working**
   - Check `data-node="chart"` in `getHTML()` / document JSON attrs
   - Verify event handlers are attached
   - Ensure no other event handlers are interfering

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Charts plugin initialized');

// Check chart events
````

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Charts are rendered on-demand
- Large datasets may affect performance
- Consider data sampling for large datasets
- Charts are cached for better performance

## Accessibility

- Screen reader support for chart data
- Keyboard navigation for chart interactions
- High contrast themes available
- Alt text for chart images

## License

MIT License - see LICENSE file for details.
