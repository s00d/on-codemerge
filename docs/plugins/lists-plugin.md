# Lists Plugin

The Lists Plugin provides comprehensive list management capabilities for the on-CodeMerge editor, supporting both ordered and unordered lists with advanced formatting and keyboard shortcuts.

## Features

- **Ordered Lists**: Numbered lists with automatic numbering
- **Unordered Lists**: Bulleted lists with custom bullet styles
- **List Toggle**: Convert between ordered and unordered lists
- **Keyboard Shortcuts**: Quick list creation and management
- **List Exit**: Exit lists with keyboard shortcuts
- **Toolbar Integration**: Easy access via toolbar buttons
- **Active State**: Visual feedback for current list type
- **Nested Lists**: Support for nested list structures
- **List Styling**: Customizable list appearance

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ListsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ListsPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ListsPlugin']" />

## API Reference

### List Creation

```javascript
// Create unordered list
editor.executeCommand('lists-unordered');

// Create ordered list
editor.executeCommand('lists-ordered');

// Toggle list type
editor.executeCommand('toggleList', { type: 'ordered' });
```

### List Operations

```javascript
// Convert list type
editor.executeCommand('convertList', {
  from: 'unordered',
  to: 'ordered'
});

// Exit list
editor.executeCommand('exitList');

// Add list item
editor.executeCommand('addListItem');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+U` | Create unordered list | `lists-unordered` |
| `Ctrl+Shift+O` | Create ordered list | `lists-ordered` |
| `Ctrl+Enter` / `Cmd+Enter` | Exit list and insert break | Auto-exit |

## List Types

### Unordered Lists (Bullet Lists)
```html
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
```

### Ordered Lists (Numbered Lists)
```html
<ol>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ol>
```

### Nested Lists
```html
<ul>
  <li>Main item 1
    <ul>
      <li>Sub item 1.1</li>
      <li>Sub item 1.2</li>
    </ul>
  </li>
  <li>Main item 2
    <ol>
      <li>Numbered sub item 2.1</li>
      <li>Numbered sub item 2.2</li>
    </ol>
  </li>
</ul>
```

## Context Menu

Right-click on a list to access:

### List Operations
- **Convert to Ordered List**: Change to numbered list
- **Convert to Unordered List**: Change to bullet list
- **Remove List**: Convert list to regular text
- **Add Item**: Insert new list item

### List Styling
- **List Style**: Choose bullet or number style
- **List Indent**: Adjust list indentation
- **List Spacing**: Modify list item spacing

## List Behavior

### Toggle Functionality
- Clicking the same list type button removes the list
- Clicking a different list type converts the list
- Selecting text and clicking creates a new list

### Keyboard Navigation
- **Enter**: Create new list item
- **Shift+Enter**: Create new line within item
- **Tab**: Indent list item (create nested list)
- **Shift+Tab**: Outdent list item
- **Ctrl+Enter**: Exit list and create paragraph

### Active State
The plugin shows active state for list buttons:
- Button highlights when cursor is in a list
- Different highlighting for ordered vs unordered lists
- Visual feedback for current list type

## Events

```javascript
// Listen to list events
editor.on('list:created', (list) => {
  console.log('List created:', list);
});

editor.on('list:converted', (list, fromType, toType) => {
  console.log('List converted:', list, fromType, toType);
});

editor.on('list:removed', (list) => {
  console.log('List removed:', list);
});

editor.on('list-item:added', (item) => {
  console.log('List item added:', item);
});

editor.on('list:exited', (list) => {
  console.log('List exited:', list);
});
```

## Examples

### Basic Unordered List

```html
<ul>
  <li>Apple</li>
  <li>Banana</li>
  <li>Cherry</li>
  <li>Date</li>
</ul>
```

### Basic Ordered List

```html
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
  <li>Fourth step</li>
</ol>
```

### Mixed List Types

```html
<ol>
  <li>Main task
    <ul>
      <li>Subtask 1</li>
      <li>Subtask 2</li>
    </ul>
  </li>
  <li>Another main task
    <ol>
      <li>Numbered subtask 1</li>
      <li>Numbered subtask 2</li>
    </ol>
  </li>
</ol>
```

### List with Custom Styling

```html
<ul class="custom-list">
  <li class="list-item">Custom styled item 1</li>
  <li class="list-item">Custom styled item 2</li>
  <li class="list-item">Custom styled item 3</li>
</ul>
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, ListsPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ListsPlugin());
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
import { HTMLEditor, ListsPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ListsPlugin());
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
/* List container styles */
.html-editor ul,
.html-editor ol {
  margin: 1rem 0;
  padding-left: 2rem;
}

.html-editor li {
  margin: 0.5rem 0;
  line-height: 1.6;
}

/* Unordered list bullets */
.html-editor ul li {
  list-style-type: disc;
}

.html-editor ul ul li {
  list-style-type: circle;
}

.html-editor ul ul ul li {
  list-style-type: square;
}

/* Ordered list numbers */
.html-editor ol li {
  list-style-type: decimal;
}

.html-editor ol ol li {
  list-style-type: lower-alpha;
}

.html-editor ol ol ol li {
  list-style-type: lower-roman;
}
```

### Custom List Styles

```css
/* Custom bullet styles */
.custom-list {
  list-style: none;
  padding-left: 0;
}

.custom-list li {
  position: relative;
  padding-left: 1.5rem;
}

.custom-list li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: #3b82f6;
  font-weight: bold;
}

/* Custom numbered list */
.numbered-list {
  counter-reset: item;
  list-style: none;
  padding-left: 0;
}

.numbered-list li {
  counter-increment: item;
  position: relative;
  padding-left: 2rem;
}

.numbered-list li::before {
  content: counter(item);
  position: absolute;
  left: 0;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}
```

### Active Button Styles

```css
/* Active toolbar button styles */
.toolbar-button.active {
  background-color: #3b82f6;
  color: white;
}

.toolbar-button.active:hover {
  background-color: #1d4ed8;
}
```

## Troubleshooting

### Common Issues

1. **Lists not creating**
   - Check if plugin is properly initialized
   - Verify toolbar buttons are present
   - Check console for JavaScript errors

2. **List toggle not working**
   - Ensure text is selected before creating list
   - Check for conflicting keyboard shortcuts
   - Verify event handlers are attached

3. **List exit not working**
   - Check keyboard shortcut (Ctrl+Enter or Cmd+Enter)
   - Ensure cursor is inside a list item
   - Verify exit function is properly implemented

4. **Active state not updating**
   - Check selection change event handlers
   - Verify list detection logic
   - Ensure button state management is working

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Lists plugin initialized');

// Check list events
editor.on('list:created', (list) => {
  console.log('List created:', list);
});

// Check selection changes
editor.on('selectionchange', () => {
  console.log('Selection changed');
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Lists are created on-demand
- Event delegation is used for efficiency
- Selection change events are debounced
- List detection is optimized

## Accessibility

- Proper list semantics for screen readers
- Keyboard navigation support
- ARIA labels for list controls
- High contrast list styles

## License

MIT License - see LICENSE file for details. 
