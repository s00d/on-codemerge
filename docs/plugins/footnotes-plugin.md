# Footnotes Plugin

The Footnotes Plugin provides comprehensive footnote management for the on-CodeMerge editor, allowing users to create, edit, and manage footnotes with automatic numbering and formatting.

## Features

- **Footnote Creation**: Add footnotes to selected text
- **Automatic Numbering**: Sequential footnote numbering
- **Footnote Editing**: Edit footnote content and references
- **Visual Markers**: Footnote markers with hover tooltips
- **Footnote List**: Organized footnote display
- **Cross-references**: Automatic reference linking
- **Toolbar Integration**: Easy access via toolbar button
- **Keyboard Shortcuts**: Quick footnote commands
- **Footnote Management**: Create, edit, delete footnotes

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, FootnotesPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FootnotesPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['FootnotesPlugin']" />

## API Reference

### Footnote Methods

```javascript
// Add footnote to selected text
editor.executeCommand('footnote');

// Get all footnotes
const footnotes = footnoteManager.getAllFootnotes();

// Get specific footnote
const footnote = footnoteManager.getFootnote(id);

// Update footnote
footnoteManager.updateFootnote(id, content);

// Delete footnote
footnoteManager.deleteFootnote(id);
```

### Footnote Interface

```javascript
interface Footnote {
  id: string;           // Unique footnote identifier
  number: number;       // Footnote number
  content: string;      // Footnote content
  reference: string;    // Reference text
  createdAt: number;    // Creation timestamp
  updatedAt: number;    // Last update timestamp
}
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+X` | Add footnote | `footnote` |

## Events

```javascript
// Listen to footnote events
editor.on('footnote:added', (footnote) => {
  console.log('Footnote added:', footnote);
});

editor.on('footnote:updated', (footnote) => {
  console.log('Footnote updated:', footnote);
});

editor.on('footnote:deleted', (footnoteId) => {
  console.log('Footnote deleted:', footnoteId);
});
```

## Examples

### Basic Footnote Usage

```html
<!-- Text with footnote -->
<p>
  This is a sentence with a footnote<sup class="footnote-marker" data-footnote-id="fn1">1</sup>.
</p>

<!-- Footnote content -->
<div class="footnote" id="fn1">
  <sup>1</sup> This is the footnote content.
</div>
```

### Multiple Footnotes

```html
<p>
  First footnote<sup class="footnote-marker" data-footnote-id="fn1">1</sup> 
  and second footnote<sup class="footnote-marker" data-footnote-id="fn2">2</sup>.
</p>

<div class="footnotes">
  <div class="footnote" id="fn1">
    <sup>1</sup> First footnote content.
  </div>
  <div class="footnote" id="fn2">
    <sup>2</sup> Second footnote content.
  </div>
</div>
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, FootnotesPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new FootnotesPlugin());
      
      // Track footnote events
      editorInstance.current.on('footnote:added', (footnote) => {
        console.log('New footnote:', footnote);
      });
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
import { HTMLEditor, FootnotesPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new FootnotesPlugin());
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
/* Footnote marker */
.footnote-marker {
  color: #3b82f6;
  font-size: 0.8em;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
}

.footnote-marker:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

/* Footnote content */
.footnote {
  margin: 8px 0;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  font-size: 0.9em;
  line-height: 1.4;
}

/* Footnotes container */
.footnotes {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Footnote number */
.footnote sup {
  color: #3b82f6;
  font-weight: bold;
}
```

## Troubleshooting

### Common Issues

1. **Footnote not adding**
   - Check if text is selected
   - Verify plugin initialization
   - Check for JavaScript errors
   - Ensure footnote manager is working

2. **Footnote numbering issues**
   - Check automatic numbering logic
   - Verify footnote order
   - Check for duplicate numbers
   - Ensure proper renumbering

3. **Footnote display problems**
   - Check CSS styling
   - Verify footnote container
   - Check for layout conflicts
   - Ensure proper positioning

### Debug Mode

```javascript
// Add console logging
console.log('Footnotes plugin initialized');

// Check footnote events
editor.on('footnote:added', (footnote) => {
  console.log('Footnote added:', footnote);
});

// Check footnote manager
const allFootnotes = footnoteManager.getAllFootnotes();
console.log('All footnotes:', allFootnotes);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
