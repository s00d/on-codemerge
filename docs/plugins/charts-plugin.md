# Charts Plugin

The Charts Plugin provides comprehensive chart creation and management capabilities for the on-CodeMerge editor, supporting multiple chart types with interactive features and data visualization.

## Features

- **Multiple Chart Types**: Bar, Line, Pie, Doughnut, Area, Radar, Scatter, and Bubble charts
- **Interactive Charts**: Click to resize, context menu for editing
- **Data Management**: Easy data input and editing
- **Chart Customization**: Colors, themes, and styling options
- **Responsive Charts**: Automatic resizing and responsive behavior
- **Export Support**: Export charts as images or data
- **Real-time Updates**: Dynamic chart updates with data changes

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ChartsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ChartsPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ChartsPlugin']" />

## API Reference

### Chart Creation

```javascript
// Insert chart programmatically
editor.executeCommand('charts');

// Create chart with specific data
const chartData = [
  {
    name: 'Sales',
    data: [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 150 },
      { label: 'Mar', value: 200 }
    ],
    color: '#3b82f6'
  }
];

editor.executeCommand('insertChart', {
  type: 'bar',
  data: chartData,
  options: {
    width: 600,
    height: 400
  }
});
```

### Chart Operations

```javascript
// Update chart data
editor.executeCommand('updateChart', {
  chart: chartElement,
  data: newData
});

// Resize chart
editor.executeCommand('resizeChart', {
  chart: chartElement,
  width: 800,
  height: 500
});

// Export chart
editor.executeCommand('exportChart', {
  chart: chartElement,
  format: 'png'
});
```

## Supported Chart Types

### Bar Chart
- **Type**: `bar`
- **Supports Multiple Series**: No
- **Best For**: Comparing categories, discrete data
- **Data Format**: Single series with labels and values

```javascript
const barData = [
  {
    name: 'Sales',
    data: [
      { label: 'Q1', value: 100 },
      { label: 'Q2', value: 150 },
      { label: 'Q3', value: 200 },
      { label: 'Q4', value: 180 }
    ]
  }
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
      { label: 'Mar', value: 200 }
    ],
    color: '#3b82f6'
  },
  {
    name: 'Expenses',
    data: [
      { label: 'Jan', value: 80 },
      { label: 'Feb', value: 120 },
      { label: 'Mar', value: 160 }
    ],
    color: '#ef4444'
  }
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
      { label: 'Product D', value: 10 }
    ]
  }
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
      { label: 'Point 3', x: 20, y: 30 }
    ]
  }
];
```

### Bubble Chart
- **Type**: `bubble`
- **Supports Multiple Series**: Yes
- **Requires XY Data**: Yes
- **Best For**: Three-dimensional data visualization
- **Data Format**: Multiple series with x, y, and size values

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+G` | Insert chart | `charts` |

## Context Menu

Right-click on a chart to access:

### Chart Operations
- **Edit Chart**: Open chart editor
- **Duplicate Chart**: Create a copy
- **Delete Chart**: Remove chart
- **Export Chart**: Save as image

### Data Operations
- **Edit Data**: Modify chart data
- **Import Data**: Load data from file
- **Export Data**: Save data to file

### Styling
- **Chart Theme**: Apply different themes
- **Colors**: Customize chart colors
- **Size**: Adjust chart dimensions

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

```javascript
// Listen to chart events
editor.on('chart:created', (chart) => {
  console.log('Chart created:', chart);
});

editor.on('chart:updated', (chart) => {
  console.log('Chart updated:', chart);
});

editor.on('chart:deleted', (chart) => {
  console.log('Chart deleted:', chart);
});

editor.on('chart:resized', (chart, dimensions) => {
  console.log('Chart resized:', chart, dimensions);
});

editor.on('chart:exported', (chart, format) => {
  console.log('Chart exported:', chart, format);
});
```

## Examples

### Basic Bar Chart

```html
<div class="chart-container" data-chart-type="bar" data-chart-data='[{"name":"Sales","data":[{"label":"Jan","value":100},{"label":"Feb","value":150},{"label":"Mar","value":200}]}]' style="width: 600px; height: 400px;">
  <!-- Chart will be rendered here -->
</div>
```

### Multi-Series Line Chart

```html
<div class="chart-container" data-chart-type="line" data-chart-data='[{"name":"Revenue","data":[{"label":"Jan","value":100},{"label":"Feb","value":150},{"label":"Mar","value":200}],"color":"#3b82f6"},{"name":"Expenses","data":[{"label":"Jan","value":80},{"label":"Feb","value":120},{"label":"Mar","value":160}],"color":"#ef4444"}]' style="width: 600px; height: 400px;">
  <!-- Chart will be rendered here -->
</div>
```

### Pie Chart

```html
<div class="chart-container" data-chart-type="pie" data-chart-data='[{"name":"Market Share","data":[{"label":"Product A","value":40},{"label":"Product B","value":30},{"label":"Product C","value":20},{"label":"Product D","value":10}]}]' style="width: 400px; height: 400px;">
  <!-- Chart will be rendered here -->
</div>
```

### Scatter Plot

```html
<div class="chart-container" data-chart-type="scatter" data-chart-data='[{"name":"Dataset 1","data":[{"label":"Point 1","x":10,"y":20},{"label":"Point 2","x":15,"y":25},{"label":"Point 3","x":20,"y":30}]}]' style="width: 600px; height: 400px;">
  <!-- Chart will be rendered here -->
</div>
```

## Chart Customization

### Themes
```javascript
// Apply different themes
const chartOptions = {
  theme: 'dark', // or 'light', 'blue', 'green', etc.
  colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
  fontFamily: 'Arial, sans-serif',
  fontSize: 12
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
import { HTMLEditor, ChartsPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ChartsPlugin());
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
import { HTMLEditor, ChartsPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ChartsPlugin());
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

editor.executeCommand('importChartData', {
  chart: chartElement,
  data: JSON.parse(jsonData)
});
```

### Export Data
```javascript
// Export chart data
const data = editor.executeCommand('exportChartData', {
  chart: chartElement,
  format: 'json'
});

// Export chart as image
const imageData = editor.executeCommand('exportChartImage', {
  chart: chartElement,
  format: 'png',
  width: 800,
  height: 600
});
```

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
   - Check if chart has correct class `chart-container`
   - Verify event handlers are attached
   - Ensure no other event handlers are interfering

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Charts plugin initialized');

// Check chart events
editor.on('chart:created', (chart) => {
  console.log('Chart created:', chart);
});
```

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
