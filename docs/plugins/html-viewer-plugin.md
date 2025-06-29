# HTML Viewer Plugin

The HTML Viewer Plugin provides HTML code viewing and syntax highlighting capabilities for the on-CodeMerge editor, allowing users to view and analyze HTML code with enhanced readability.

## Features

- **HTML Viewing**: View HTML code in a dedicated viewer
- **Syntax Highlighting**: Color-coded HTML syntax
- **Code Formatting**: Automatic HTML formatting and indentation
- **Line Numbers**: Line numbering for easy reference
- **Search and Replace**: Find and replace functionality
- **Copy to Clipboard**: Easy code copying
- **Theme Support**: Multiple color themes
- **Responsive Design**: Mobile-friendly viewer
- **Export Options**: Export formatted HTML code

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, HTMLViewerPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new HTMLViewerPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['HTMLViewerPlugin']" />

## API Reference

### Viewer Methods

```javascript
// Open HTML viewer
htmlViewerPlugin.openViewer();

// View specific HTML content
htmlViewerPlugin.viewHTML(htmlContent);

// Format HTML code
const formattedHTML = htmlViewerPlugin.formatHTML(htmlContent);

// Highlight syntax
const highlightedHTML = htmlViewerPlugin.highlightSyntax(htmlContent);

// Export formatted code
htmlViewerPlugin.exportCode(format);
```

### Viewer Configuration

```javascript
interface HTMLViewerConfig {
  theme?: 'light' | 'dark' | 'monokai' | 'github';
  showLineNumbers?: boolean;
  showLineHighlight?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  tabSize?: number;
}
```

## Events

```javascript
// Listen to viewer events
editor.on('html-viewer:opened', () => {
  console.log('HTML viewer opened');
});

editor.on('html-viewer:closed', () => {
  console.log('HTML viewer closed');
});

editor.on('html-viewer:content-changed', (content) => {
  console.log('HTML content changed:', content);
});

editor.on('html-viewer:exported', (format) => {
  console.log('HTML exported as:', format);
});
```

## Examples

### Basic HTML Viewing

```javascript
// Initialize with HTML viewer
const editor = new HTMLEditor(container);
editor.use(new HTMLViewerPlugin());

// Open viewer with current content
const currentHTML = editor.getHtml();
htmlViewerPlugin.viewHTML(currentHTML);
```

### Custom Viewer Configuration

```javascript
// Configure HTML viewer
const htmlViewerPlugin = new HTMLViewerPlugin({
  theme: 'dark',
  showLineNumbers: true,
  showLineHighlight: true,
  wordWrap: true,
  fontSize: 14,
  tabSize: 2
});

editor.use(htmlViewerPlugin);
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, HTMLViewerPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new HTMLViewerPlugin());
      
      // Track viewer state
      editorInstance.current.on('html-viewer:opened', () => {
        setViewerOpen(true);
      });
      
      editorInstance.current.on('html-viewer:closed', () => {
        setViewerOpen(false);
      });
    }

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <div className="viewer-status">
        HTML Viewer: {viewerOpen ? 'Open' : 'Closed'}
      </div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <button @click="openViewer" :disabled="viewerOpen">
      View HTML
    </button>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import { HTMLEditor, HTMLViewerPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  data() {
    return {
      editor: null,
      viewerOpen: false
    };
  },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new HTMLViewerPlugin());
    
    this.editor.on('html-viewer:opened', () => {
      this.viewerOpen = true;
    });
    
    this.editor.on('html-viewer:closed', () => {
      this.viewerOpen = false;
    });
  },
  methods: {
    openViewer() {
      const html = this.editor.getHtml();
      this.htmlViewerPlugin.viewHTML(html);
    }
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
};
</script>
```

## Styling

### Default Styles

```css
/* HTML viewer modal */
.html-viewer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* HTML viewer container */
.html-viewer-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

/* HTML viewer header */
.html-viewer-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* HTML viewer content */
.html-viewer-content {
  padding: 20px;
  overflow: auto;
  max-height: calc(90vh - 120px);
}

/* Code highlighting */
.html-viewer-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 16px;
  overflow-x: auto;
}

/* Syntax highlighting */
.html-tag {
  color: #d73a49;
}

.html-attribute {
  color: #6f42c1;
}

.html-value {
  color: #032f62;
}

.html-comment {
  color: #6a737d;
  font-style: italic;
}
```

## Troubleshooting

### Common Issues

1. **Viewer not opening**
   - Check plugin initialization
   - Verify modal creation
   - Check for JavaScript errors
   - Ensure proper event handling

2. **Syntax highlighting not working**
   - Check HTML parser
   - Verify highlighting rules
   - Check for CSS conflicts
   - Ensure proper tokenization

3. **Performance issues**
   - Check large HTML handling
   - Verify efficient parsing
   - Check for memory leaks
   - Ensure proper cleanup

### Debug Mode

```javascript
// Add console logging
console.log('HTML Viewer plugin initialized');

// Check viewer events
editor.on('html-viewer:opened', () => {
  console.log('HTML viewer opened');
});

// Check HTML formatting
const formatted = htmlViewerPlugin.formatHTML(htmlContent);
console.log('Formatted HTML:', formatted);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
