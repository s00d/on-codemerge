# Toolbar Divider Plugin

The Toolbar Divider Plugin provides visual separation and organization capabilities for the on-CodeMerge editor toolbar, allowing users to group related tools and improve toolbar layout.

## Features

- **Visual Separation**: Add dividers between toolbar groups
- **Flexible Positioning**: Place dividers anywhere in toolbar
- **Custom Styling**: Customize divider appearance
- **Responsive Design**: Dividers adapt to toolbar size
- **Multiple Dividers**: Add multiple dividers as needed
- **Toolbar Organization**: Group related tools logically
- **Theme Support**: Dividers match current theme
- **Accessibility**: Screen reader friendly dividers

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ToolbarDividerPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ToolbarDividerPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ToolbarDividerPlugin']" />

## API Reference

### Divider Methods

```javascript
// Add divider to toolbar
editor.addToolbarDivider();

// Add divider at specific position
editor.addToolbarDivider(3); // After 3rd item

// Remove divider
editor.removeToolbarDivider(dividerId);

// Get all dividers
const dividers = editor.getToolbarDividers();
```

## Events

```javascript
// Listen to divider events
editor.on('divider:added', (divider) => {
  console.log('Divider added:', divider);
});

editor.on('divider:removed', (dividerId) => {
  console.log('Divider removed:', dividerId);
});
```

## Examples

### Basic Divider Usage

```javascript
// Initialize with divider plugin
const editor = new HTMLEditor(container);
editor.use(new ToolbarDividerPlugin());

// Add dividers to organize toolbar
editor.addToolbarDivider(); // After text formatting
editor.addToolbarDivider(); // After alignment
editor.addToolbarDivider(); // After media tools
```

### Custom Divider Styling

```javascript
// Add divider with custom styling
editor.addToolbarDivider({
  style: 'dashed',
  color: '#6b7280',
  width: '2px'
});
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, ToolbarDividerPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ToolbarDividerPlugin());
      
      // Add dividers after initialization
      setTimeout(() => {
        editorInstance.current.addToolbarDivider();
        editorInstance.current.addToolbarDivider();
      }, 100);
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
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
import { HTMLEditor, ToolbarDividerPlugin } from 'on-codemerge';
export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ToolbarDividerPlugin());
    
    // Add dividers
    this.$nextTick(() => {
      this.editor.addToolbarDivider();
      this.editor.addToolbarDivider();
    });
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: #d1d5db;
  margin: 0 8px;
  border-radius: 1px;
}

.toolbar-divider.dashed {
  border-left: 1px dashed #d1d5db;
  background: none;
}

.toolbar-divider.dotted {
  border-left: 1px dotted #d1d5db;
  background: none;
}

.toolbar-divider.thick {
  width: 2px;
}

.toolbar-divider.colored {
  background-color: #3b82f6;
}

/* Dark theme */
.toolbar-divider.dark {
  background-color: #4b5563;
}

/* Responsive */
@media (max-width: 768px) {
  .toolbar-divider {
    margin: 0 4px;
    height: 20px;
  }
}
```

## Troubleshooting

1. **Divider not appearing**
   - Check if plugin is initialized
   - Verify toolbar exists
   - Check for CSS conflicts
   - Ensure proper positioning

2. **Divider styling issues**
   - Check CSS specificity
   - Verify theme compatibility
   - Check for conflicting styles
   - Ensure proper class names

3. **Responsive issues**
   - Check mobile breakpoints
   - Verify responsive CSS
   - Test on different screen sizes
   - Ensure proper scaling

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
