# Export Plugin

The Export Plugin provides comprehensive export capabilities for the on-CodeMerge editor, allowing users to export their documents in various formats including PDF, HTML, Markdown, and more.

## Features

- **Multiple Export Formats**: PDF, HTML, Markdown, DOCX, TXT
- **Export Customization**: Customize export settings
- **Export Preview**: Preview before exporting
- **Batch Export**: Export multiple documents
- **Export Templates**: Pre-defined export templates
- **Quality Settings**: Adjust export quality
- **Page Setup**: Configure page layout
- **Export History**: Track export history
- **Export Scheduling**: Schedule exports
- **Export Notifications**: Get notified when export completes

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ExportPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ExportPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ExportPlugin']" />

## API Reference

### Export Methods

```javascript
// Export to PDF
editor.exportToPDF(options);

// Export to HTML
editor.exportToHTML(options);

// Export to Markdown
editor.exportToMarkdown(options);

// Export to DOCX
editor.exportToDOCX(options);

// Export to TXT
editor.exportToTXT(options);

// Get export history
const history = editor.getExportHistory();

// Get export templates
const templates = editor.getExportTemplates();
```

## Supported Export Formats

- **PDF**: Portable Document Format
- **HTML**: HyperText Markup Language
- **Markdown**: Lightweight markup language
- **DOCX**: Microsoft Word document
- **TXT**: Plain text format
- **RTF**: Rich Text Format
- **EPUB**: Electronic publication format

## Events

```javascript
// Listen to export events
editor.on('export:started', (format) => {
  console.log('Export started:', format);
});

editor.on('export:completed', (result) => {
  console.log('Export completed:', result);
});

editor.on('export:error', (error) => {
  console.log('Export error:', error);
});

editor.on('export:progress', (progress) => {
  console.log('Export progress:', progress);
});
```

## Examples

### Basic Export Usage

```javascript
// Initialize export plugin
const editor = new HTMLEditor(container);
editor.use(new ExportPlugin());

// Export to PDF
editor.exportToPDF({
  filename: 'document.pdf',
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 }
});

// Export to HTML
editor.exportToHTML({
  filename: 'document.html',
  includeStyles: true,
  includeScripts: false
});
```

### Export Configuration

```javascript
// Configure export plugin
const exportPlugin = new ExportPlugin({
  defaultFormat: 'PDF',
  defaultQuality: 'high',
  autoSave: true,
  exportPath: '/exports/',
  maxFileSize: 50 * 1024 * 1024 // 50MB
});

editor.use(exportPlugin);
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, ExportPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ExportPlugin());
      
      editorInstance.current.on('export:progress', (progress) => {
        setExportProgress(progress);
      });
      
      editorInstance.current.on('export:completed', (result) => {
        console.log('Export completed:', result);
        setExportProgress(0);
      });
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
    };
  }, []);

  const handleExport = (format) => {
    switch (format) {
      case 'pdf':
        editorInstance.current.exportToPDF();
        break;
      case 'html':
        editorInstance.current.exportToHTML();
        break;
      case 'markdown':
        editorInstance.current.exportToMarkdown();
        break;
    }
  };

  return (
    <div>
      <div>Export Progress: {exportProgress}%</div>
      <button onClick={() => handleExport('pdf')}>Export PDF</button>
      <button onClick={() => handleExport('html')}>Export HTML</button>
      <button onClick={() => handleExport('markdown')}>Export Markdown</button>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div>Export Progress: {{ exportProgress }}%</div>
    <button @click="exportDocument('pdf')">Export PDF</button>
    <button @click="exportDocument('html')">Export HTML</button>
    <button @click="exportDocument('markdown')">Export Markdown</button>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, ExportPlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, exportProgress: 0 }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ExportPlugin());
    
    this.editor.on('export:progress', progress => {
      this.exportProgress = progress;
    });
    
    this.editor.on('export:completed', result => {
      console.log('Export completed:', result);
      this.exportProgress = 0;
    });
  },
  methods: {
    exportDocument(format) {
      switch (format) {
        case 'pdf':
          this.editor.exportToPDF();
          break;
        case 'html':
          this.editor.exportToHTML();
          break;
        case 'markdown':
          this.editor.exportToMarkdown();
          break;
      }
    }
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.export-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  min-width: 300px;
  max-height: 500px;
  overflow-y: auto;
}

.export-option {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-option:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.export-option.selected {
  border-color: #3b82f6;
  background-color: #dbeafe;
}

.export-icon {
  width: 24px;
  height: 24px;
  color: #6b7280;
}

.export-option:hover .export-icon {
  color: #3b82f6;
}

.export-progress {
  width: 100%;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin: 8px 0;
}

.export-progress-bar {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.export-settings {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.export-setting {
  margin-bottom: 12px;
}

.export-setting-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  font-size: 14px;
}

.export-setting-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.export-setting-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## Troubleshooting

1. **Export not working**
   - Check file permissions
   - Verify export format support
   - Check for JavaScript errors
   - Ensure proper initialization

2. **Export quality issues**
   - Check export settings
   - Verify content formatting
   - Check for CSS conflicts
   - Ensure proper encoding

3. **Export performance issues**
   - Reduce document size
   - Check export format
   - Verify system resources
   - Use background processing

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
