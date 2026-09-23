# Table Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Table Plugin provides comprehensive table management capabilities for the on-CodeMerge editor, including table creation, editing, styling, data import/export, and lazy loading functionality.

## Features

- **Table Creation**: Insert tables with custom rows and columns
- **Table Editing**: Add/remove rows and columns, merge/split cells
- **Cell Operations**: Copy, cut, paste, delete cell content
- **Table Styling**: Apply themes, borders, colors, and responsive settings
- **Data Import/Export**: Import from JSON/CSV, export to various formats
- **Lazy Loading**: Load table data from external sources with automatic updates
- **Context Menu**: Right-click for quick table operations
- **Keyboard Navigation**: Full keyboard support for table editing
- **Responsive Tables**: Automatic responsive behavior for mobile devices

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, TablePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new TablePlugin());
```

## Demo
## API Reference

### Table Creation

```javascript
// Insert a new table
editor.executeCommand('insertTable', {
  rows: 3,
  columns: 4,
  hasHeader: true
});

// Insert lazy loading table
editor.executeCommand('insertLazyTable', {
  url: 'https://api.example.com/data.json',
  format: 'json',
  tableId: 'my-table',
  hasHeaders: true
});
```

### Table Operations

```javascript
// Add row/column
editor.executeCommand('addRow', { position: 'below' });
editor.executeCommand('addColumn', { position: 'right' });

// Delete row/column
editor.executeCommand('deleteRow');
editor.executeCommand('deleteColumn');

// Merge/split cells
editor.executeCommand('mergeCells', { direction: 'horizontal' });
editor.executeCommand('splitCell');

// Cell operations
editor.executeCommand('copyCell');
editor.executeCommand('cutCell');
editor.executeCommand('pasteCell');
editor.executeCommand('deleteCellContent');
```

### Data Import/Export

```javascript
// Export table
editor.executeCommand('exportTable', { format: 'html' });

// Import table
editor.executeCommand('importTable', {
  url: 'https://api.example.com/data.json',
  format: 'json',
  hasHeaders: true
});

_…trimmed for the v1 archive. See source history for the full guide._
