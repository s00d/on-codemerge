# Charts Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
