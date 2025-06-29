# Shortcuts Plugin

The Shortcuts Plugin provides customizable keyboard shortcut management for the on-CodeMerge editor, allowing users to configure, view, and use hotkeys for editor actions.

## Features

- **Custom Hotkeys**: Define and manage custom keyboard shortcuts
- **Default Shortcuts**: Predefined hotkeys for common actions
- **Shortcut Menu**: View and edit shortcuts in a dedicated menu
- **Conflict Detection**: Warn about conflicting shortcuts
- **Toolbar Integration**: Shortcut menu in the toolbar
- **Hotkey Support**: Quick access to all editor features
- **Event Hooks**: Listen to shortcut events
- **Accessibility**: Keyboard navigation for all actions

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ShortcutsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ShortcutsPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ShortcutsPlugin']" />

## API Reference

### Shortcut Methods

```javascript
// Add custom shortcut
editor.addShortcut('Ctrl+Shift+S', 'save-document');

// Remove shortcut
editor.removeShortcut('Ctrl+Shift+S');

// List all shortcuts
const shortcuts = editor.getShortcuts();

// Trigger shortcut programmatically
editor.triggerShortcut('Ctrl+Shift+S');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+S` | Save document | `save-document` |
| `Ctrl+Alt+M` | Insert comment | `comment` |
| `Ctrl+Alt+E` | Export document | `export` |
| ... | ... | ... |

## Events

```javascript
// Listen to shortcut events
editor.on('shortcut:triggered', (shortcut, command) => {
  console.log('Shortcut triggered:', shortcut, command);
});

editor.on('shortcut:added', (shortcut, command) => {
  console.log('Shortcut added:', shortcut, command);
});

editor.on('shortcut:removed', (shortcut) => {
  console.log('Shortcut removed:', shortcut);
});
```

## Examples

### Basic Shortcut Usage

```javascript
// Add a new shortcut
editor.addShortcut('Ctrl+Alt+N', 'new-document');

// Remove a shortcut
editor.removeShortcut('Ctrl+Alt+N');

// List all shortcuts
const shortcuts = editor.getShortcuts();
console.log('All shortcuts:', shortcuts);
```

### Custom Shortcut Menu

```javascript
// Open shortcut menu
editor.openShortcutMenu();

// Edit shortcut in menu
editor.editShortcut('Ctrl+Alt+M', 'comment');
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, ShortcutsPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [shortcuts, setShortcuts] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ShortcutsPlugin());
      editorInstance.current.on('shortcut:added', (shortcut, command) => {
        setShortcuts(prev => [...prev, { shortcut, command }]);
      });
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
    <div>Shortcuts: {{ shortcuts.length }}</div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, ShortcutsPlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, shortcuts: [] }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ShortcutsPlugin());
    this.editor.on('shortcut:added', (shortcut, command) => {
      this.shortcuts.push({ shortcut, command });
    });
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.shortcuts-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 20px;
  min-width: 300px;
}
.shortcut-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}
.shortcut-key {
  background: #f3f4f6;
  border-radius: 4px;
  padding: 2px 8px;
  font-family: monospace;
  font-size: 13px;
}
.shortcut-command {
  color: #374151;
  font-weight: 500;
}
.shortcut-edit {
  margin-left: auto;
  color: #3b82f6;
  cursor: pointer;
}
.shortcut-edit:hover {
  text-decoration: underline;
}
```

## Troubleshooting

1. **Shortcut not working**
   - Check if shortcut is registered
   - Verify command name is correct
   - Check for conflicts
   - Ensure plugin is initialized
2. **Conflicting shortcuts**
   - Use unique key combinations
   - Check for browser/system reserved keys
   - Edit or remove conflicting shortcuts

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
