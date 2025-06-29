# Responsive Plugin

The Responsive Plugin provides responsive design and preview capabilities for the on-CodeMerge editor, allowing users to test and preview content at different screen sizes and breakpoints.

## Features

- **Viewport Simulation**: Preview content at various device sizes
- **Custom Breakpoints**: Add and manage custom breakpoints
- **Toolbar Integration**: Responsive menu in the toolbar
- **Hotkey Support**: Quick viewport switching
- **Live Preview**: Real-time content resizing
- **Device Presets**: Mobile, tablet, desktop, and custom
- **Adaptive Layout**: Editor adapts to selected viewport
- **Event Hooks**: Listen to viewport changes

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ResponsivePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ResponsivePlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ResponsivePlugin']" />

## API Reference

### Responsive Methods

```javascript
// Set viewport
editor.setViewport('mobile');

// Get current viewport
const viewport = editor.getViewport();

// Add custom breakpoint
editor.addBreakpoint('custom', { width: 500, height: 800 });

// List available breakpoints
const breakpoints = editor.getBreakpoints();
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+R` | Open responsive menu | `responsive-menu` |

## Events

```javascript
// Listen to viewport events
editor.on('viewport:changed', (viewport) => {
  console.log('Viewport changed:', viewport);
});

editor.on('breakpoint:added', (breakpoint) => {
  console.log('Breakpoint added:', breakpoint);
});
```

## Examples

### Basic Responsive Preview

```javascript
// Switch to tablet view
editor.setViewport('tablet');

// Add a custom breakpoint
editor.addBreakpoint('wide', { width: 1200, height: 800 });
```

### Device Presets

- Mobile: 375x667
- Tablet: 768x1024
- Desktop: 1440x900
- Custom: Any size

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, ResponsivePlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [viewport, setViewport] = useState('desktop');

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ResponsivePlugin());
      editorInstance.current.on('viewport:changed', setViewport);
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
  <div>
    <div>Current viewport: {{ viewport }}</div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, ResponsivePlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, viewport: 'desktop' }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ResponsivePlugin());
    this.editor.on('viewport:changed', v => { this.viewport = v; });
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.responsive-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 20px;
  min-width: 200px;
}
.responsive-menu-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}
.responsive-menu-item:hover {
  background: #f3f4f6;
}
.responsive-menu-item.active {
  background: #3b82f6;
  color: white;
}
.editor-viewport {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  transition: width 0.2s, height 0.2s;
}
```

## Troubleshooting

1. **Viewport not switching**
   - Check if viewport name is correct
   - Verify breakpoints are defined
   - Check for JavaScript errors
2. **Custom breakpoints not working**
   - Ensure unique breakpoint names
   - Check breakpoint object structure
   - Verify width/height values

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
