# Table Plugin

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
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['TablePlugin']" />

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

// Import from HTML
editor.executeCommand('importFromHTML', {
  url: 'https://example.com/page.html',
  selector: 'table.data-table'
});
```

### Table Styling

```javascript
// Apply table style
editor.executeCommand('applyTableStyle', { theme: 'modern' });

// Set cell border
editor.executeCommand('setCellBorder', { style: 'solid' });

// Style table cell
editor.executeCommand('styleTableCell', { 
  backgroundColor: '#f0f0f0',
  color: '#333'
});
```

### Lazy Table Management

```javascript
// Edit lazy table
editor.executeCommand('editLazyTable');

// Fill table with data (without JavaScript)
editor.executeCommand('fillTable', {
  url: 'https://api.example.com/data.json',
  format: 'json'
});
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+T` | Insert table | `insert-table` |
| `Ctrl+Shift+J` | Insert lazy table | `insert-lazy-table` |
| `Ctrl+L` | Edit lazy table | `edit-lazy-table` |
| `Ctrl+Shift+Z` | Import from HTML | `import-from-html` |
| `Ctrl+Shift+E` | Export table | `export-table` |
| `Ctrl+Shift+I` | Import table | `import-table` |
| `Alt+Shift+F` | Format cells | `format-cells` |
| `Ctrl+Shift+P` | Table properties | `table-properties` |
| `Alt+Shift+S` | Sort table | `sort-table` |
| `Ctrl+Shift+R` | Resize columns | `resize-columns` |
| `Delete/Backspace` | Delete selected cells | `delete-selected-cells` |
| `Alt+Shift+C` | Copy selected cells | `copy-selected-cells` |
| `Ctrl+Shift+V` | Paste cells | `paste-cells` |
| `Ctrl+Shift+X` | Cut selected cells | `cut-selected-cells` |
| `Ctrl+Shift+A` | Select all cells | `select-all-cells` |

## Context Menu

Right-click on a table to access:

### Table Operations
- **Add Row Above/Below**: Insert new rows
- **Add Column Left/Right**: Insert new columns
- **Delete Row/Column**: Remove rows or columns
- **Delete Table**: Remove entire table

### Cell Operations
- **Insert Cell**: Add cells in different positions
- **Delete Cell**: Remove individual cells
- **Merge Cells**: Combine cells horizontally or vertically
- **Split Cell**: Separate merged cells

### Data Operations
- **Export Table**: Save table in HTML, CSV, JSON, or Excel format
- **Import Table**: Load data from JSON or CSV files
- **Edit Lazy Table**: Configure lazy loading settings
- **Fill Table**: Load data without inserting JavaScript
- **Clear Table**: Remove all content from table

### Styling
- **Table Properties**: Configure table settings
- **Cell Border**: Set border styles
- **Background Color**: Change cell background

## Lazy Loading

The plugin supports lazy loading tables that automatically fetch data from external sources:

```html
<table id="lazy-table" class="html-editor-table" 
       data-lazy-url="https://api.example.com/data.json"
       data-lazy-format="json"
       data-lazy-headers="true"
       data-lazy-delimiter=",">
  <tbody>
    <tr>
      <td contenteditable="true">Loading...</td>
    </tr>
  </tbody>
</table>
```

### Lazy Loading Configuration

```javascript
// Create lazy table with configuration
const lazyTableOptions = {
  url: 'https://api.example.com/data.json',
  format: 'json', // or 'csv'
  tableId: 'my-data-table',
  hasHeaders: true,
  delimiter: ',', // for CSV format
  onSave: (options) => {
    // Callback when lazy table is saved
    console.log('Lazy table updated:', options);
  }
};

editor.executeCommand('insertLazyTable', lazyTableOptions);
```

## Responsive Tables

The plugin automatically handles responsive table layouts:

```javascript
// Make table responsive
editor.executeCommand('applyTableResponsive', {
  breakpoint: 'mobile',
  enableHorizontalScroll: true,
  enableTouchSupport: true,
  enableCards: true
});
```

## Events

```javascript
// Listen to table events
editor.on('table:created', (table) => {
  console.log('Table created:', table);
});

editor.on('table:updated', (table) => {
  console.log('Table updated:', table);
});

editor.on('table:deleted', (table) => {
  console.log('Table deleted:', table);
});

editor.on('table:imported', (data) => {
  console.log('Data imported:', data);
});

editor.on('table:exported', (data) => {
  console.log('Data exported:', data);
});
```

## Examples

### Basic Table

```html
<table class="html-editor-table">
  <tbody>
    <tr>
      <td contenteditable="true">Header 1</td>
      <td contenteditable="true">Header 2</td>
    </tr>
    <tr>
      <td contenteditable="true">Data 1</td>
      <td contenteditable="true">Data 2</td>
    </tr>
  </tbody>
</table>
```

### Styled Table

```html
<table class="html-editor-table" style="border-collapse: collapse; width: 100%;">
  <tbody>
    <tr style="background-color: #f8f9fa;">
      <td contenteditable="true" style="border: 1px solid #dee2e6; padding: 8px;">Header 1</td>
      <td contenteditable="true" style="border: 1px solid #dee2e6; padding: 8px;">Header 2</td>
    </tr>
    <tr>
      <td contenteditable="true" style="border: 1px solid #dee2e6; padding: 8px;">Data 1</td>
      <td contenteditable="true" style="border: 1px solid #dee2e6; padding: 8px;">Data 2</td>
    </tr>
  </tbody>
</table>
```

### Lazy Loading Table

```html
<table id="lazy-table" class="html-editor-table" 
       data-lazy-url="https://api.example.com/data.json"
       data-lazy-format="json"
       data-lazy-headers="true">
  <tbody>
    <tr>
      <td contenteditable="true">Loading...</td>
    </tr>
  </tbody>
</table>
```

## Troubleshooting

### Common Issues

1. **Tables not rendering properly**
   - Ensure CSS styles are loaded
   - Check for conflicting styles in your application

2. **Import not working**
   - Verify CORS settings on the server
   - Check data format compatibility (JSON/CSV)
   - Ensure the URL is accessible

3. **Lazy loading fails**
   - Ensure the URL is accessible
   - Check data format (JSON/CSV)
   - Verify network connectivity

4. **Context menu not appearing**
   - Check if the table has the correct class `html-editor-table`
   - Ensure no other event handlers are preventing the context menu

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// Add console logging to see what's happening
console.log('Table plugin initialized');
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
