# Toolbar Plugin

The Toolbar Plugin provides the main toolbar functionality for the on-CodeMerge editor, offering a comprehensive set of editing tools and controls for document manipulation.

## Features

- **Rich Toolbar**: Complete set of editing tools
- **Customizable Layout**: Arrange tools as needed
- **Tool Groups**: Logical grouping of related tools
- **Responsive Design**: Adapts to different screen sizes
- **Theme Support**: Matches editor theme
- **Keyboard Shortcuts**: Quick access to tools
- **Tool Tips**: Helpful tool descriptions
- **Accessibility**: Screen reader support
- **Mobile Friendly**: Touch-optimized interface

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ToolbarPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ToolbarPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ToolbarPlugin']" />

## API Reference

### Toolbar Methods

```javascript
// Show/hide toolbar
editor.showToolbar();
editor.hideToolbar();

// Add custom tool
editor.addToolbarTool(tool);

// Remove tool
editor.removeToolbarTool(toolId);

// Get toolbar state
const isVisible = editor.isToolbarVisible();

// Customize toolbar
editor.setToolbarConfig(config);
```

## Tool Categories

- **Text Formatting**: Bold, italic, underline, etc.
- **Alignment**: Left, center, right, justify
- **Lists**: Bullet and numbered lists
- **Links**: Insert and edit links
- **Media**: Images, videos, files
- **Tables**: Table creation and editing
- **Code**: Code blocks and syntax highlighting
- **Special**: Special characters and symbols

## Events

```javascript
// Listen to toolbar events
editor.on('toolbar:shown', () => {
  console.log('Toolbar shown');
});

editor.on('toolbar:hidden', () => {
  console.log('Toolbar hidden');
});

editor.on('toolbar:tool-clicked', (tool) => {
  console.log('Tool clicked:', tool);
});
```

## Examples

### Basic Toolbar Usage

```javascript
// Initialize with toolbar
const editor = new HTMLEditor(container);
editor.use(new ToolbarPlugin());

// Show/hide toolbar
editor.showToolbar();
editor.hideToolbar();

// Add custom tool
editor.addToolbarTool({
  id: 'custom-tool',
  icon: 'custom-icon',
  title: 'Custom Tool',
  action: () => {
    console.log('Custom tool clicked');
  }
});
```

### Custom Toolbar Configuration

```javascript
// Configure toolbar
editor.setToolbarConfig({
  showTextFormatting: true,
  showAlignment: true,
  showLists: true,
  showLinks: true,
  showMedia: true,
  showTables: true,
  showCode: true,
  showSpecial: false
});
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, ToolbarPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [toolbarVisible, setToolbarVisible] = useState(true);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ToolbarPlugin());
      
      editorInstance.current.on('toolbar:shown', () => {
        setToolbarVisible(true);
      });
      
      editorInstance.current.on('toolbar:hidden', () => {
        setToolbarVisible(false);
      });
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
    };
  }, []);

  return (
    <div>
      <button onClick={() => {
        if (toolbarVisible) {
          editorInstance.current.hideToolbar();
        } else {
          editorInstance.current.showToolbar();
        }
      }}>
        {toolbarVisible ? 'Hide' : 'Show'} Toolbar
      </button>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <button @click="toggleToolbar">
      {{ toolbarVisible ? 'Hide' : 'Show' }} Toolbar
    </button>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, ToolbarPlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, toolbarVisible: true }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ToolbarPlugin());
    
    this.editor.on('toolbar:shown', () => {
      this.toolbarVisible = true;
    });
    
    this.editor.on('toolbar:hidden', () => {
      this.toolbarVisible = false;
    });
  },
  methods: {
    toggleToolbar() {
      if (this.toolbarVisible) {
        this.editor.hideToolbar();
      } else {
        this.editor.showToolbar();
      }
    }
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.toolbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-tool {
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-tool:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.toolbar-tool.active {
  background-color: #dbeafe;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.toolbar-tool.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-right: 1px solid #e5e7eb;
}

.toolbar-group:last-child {
  border-right: none;
}

/* Dark theme */
.toolbar.dark {
  background: #1f2937;
  border-bottom-color: #374151;
}

.toolbar-tool.dark:hover {
  background-color: #374151;
  border-color: #6b7280;
}
```

## Troubleshooting

1. **Toolbar not showing**
   - Check if plugin is initialized
   - Verify container element
   - Check for CSS conflicts
   - Ensure proper initialization

2. **Tools not working**
   - Check tool configuration
   - Verify event handlers
   - Check for JavaScript errors
   - Ensure proper permissions

3. **Responsive issues**
   - Check mobile breakpoints
   - Verify responsive CSS
   - Test on different devices
   - Ensure proper scaling

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
