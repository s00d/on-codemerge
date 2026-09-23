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

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, FootnotesPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [FootnotesPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['FootnotesPlugin']" />

## Public API (v2)

Factory: `FootnotesPlugin()`.

| Command       |                                 |
| ------------- | ------------------------------- |
| `addFootnote` | `editor.command('addFootnote')` |

### Keyboard shortcuts

| Shortcut    | Command       |
| ----------- | ------------- |
| `Mod-Alt-j` | `addFootnote` |

> **Note:** Command `addFootnote` (not `footnote`). No `footnoteManager`.

## Examples

### Basic Footnote Usage

```html
<!-- Text with footnote -->
<p>
  This is a sentence with a footnote<sup class="footnote-marker" data-footnote-id="fn1">1</sup>.
</p>

<!-- Footnote content -->
<div class="footnote" id="fn1"><sup>1</sup> This is the footnote content.</div>
```

### Multiple Footnotes

```html
<p>
  First footnote<sup class="footnote-marker" data-footnote-id="fn1">1</sup> and second footnote<sup
    class="footnote-marker"
    data-footnote-id="fn2"
    >2</sup
  >.
</p>

<div class="footnotes">
  <div class="footnote" id="fn1"><sup>1</sup> First footnote content.</div>
  <div class="footnote" id="fn2"><sup>2</sup> Second footnote content.</div>
</div>
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { Editor, FootnotesPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new Editor(editorRef.current);
      editorInstance.current.use(FootnotesPlugin());

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
import { Editor, FootnotesPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new Editor(this.$refs.editorContainer);
    this./* use plugins: [FootnotesPlugin()] in Editor(...) */;
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

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.
