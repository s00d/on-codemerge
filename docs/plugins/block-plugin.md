# Block Plugin

The Block Plugin provides modular content block management for the on-CodeMerge editor, allowing users to create, edit, and organize content in structured blocks with different types and behaviors.

## Features

- **Block Types**: Text blocks, container blocks, and custom block types
- **Block Management**: Create, delete, duplicate, merge, and split blocks
- **Keyboard Navigation**: Tab navigation between blocks, Enter to create new blocks
- **Block Resizing**: Interactive resizing for text blocks
- **Context Menu**: Right-click for block operations
- **Auto-merge**: Automatic merging of empty adjacent blocks
- **Block Focus**: Visual feedback for active blocks
- **Content Editing**: Rich text editing within blocks

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, BlockPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new BlockPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['BlockPlugin']" />

## API Reference

### Block Creation

```javascript
// Insert basic block
editor.executeCommand('block');

// Insert text block
editor.executeCommand('block-text');

// Insert container block
editor.executeCommand('block-container');
```

### Block Operations

```javascript
// Delete block
editor.executeCommand('deleteBlock', { block: blockElement });

// Duplicate block
editor.executeCommand('duplicateBlock', { block: blockElement });

// Merge blocks
editor.executeCommand('mergeBlocks', { blocks: [block1, block2] });

// Split block
editor.executeCommand('splitBlock', { 
  block: blockElement, 
  position: 'middle' 
});
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+B` | Insert block | `block` |
| `Ctrl+Alt+T` | Insert text block | `block-text` |
| `Ctrl+Alt+C` | Insert container block | `block-container` |
| `Enter` | Create new block after current | Auto-creation |
| `Tab` | Navigate to next block | Navigation |
| `Shift+Tab` | Navigate to previous block | Navigation |
| `Backspace` | Merge with previous block (if empty) | Auto-merge |
| `Delete` | Merge with next block (if empty) | Auto-merge |

## Block Types

### Text Block
Editable text content with rich formatting capabilities.

```html
<div class="editor-block" data-block-type="text">
  <div class="block-content" contenteditable="true">
    Editable text content here...
  </div>
</div>
```

### Container Block
Container for other content elements.

```html
<div class="editor-block" data-block-type="container">
  <div class="block-content">
    <!-- Other content can be placed here -->
  </div>
</div>
```

### Custom Block Types
Extend the plugin to support custom block types.

## Context Menu

Right-click on a block to access:

### Block Operations
- **Delete Block**: Remove the block from the editor
- **Duplicate Block**: Create a copy of the block
- **Split Block**: Divide the block into two parts
- **Merge with Previous**: Combine with the block above
- **Merge with Next**: Combine with the block below

### Block Management
- **Block Properties**: Configure block settings
- **Block Style**: Apply custom styling
- **Block Type**: Change block type

## Block Lifecycle

### 1. Block Creation
```javascript
// Block is created with default structure
const block = document.createElement('div');
block.className = 'editor-block';
block.setAttribute('data-block-type', 'text');

const content = document.createElement('div');
content.className = 'block-content';
content.contentEditable = 'true';
content.textContent = 'New block content';

block.appendChild(content);
```

### 2. Block Activation
When a block is clicked, it becomes active:
- Visual feedback is applied
- Resize handles are attached (for text blocks)
- Context menu is enabled

### 3. Block Editing
- Content becomes editable
- Keyboard navigation is enabled
- Auto-merge behavior is active

### 4. Block Deactivation
When focus moves away:
- Visual feedback is removed
- Resize handles are detached
- Auto-merge of empty blocks occurs

## Events

```javascript
// Listen to block events
editor.on('block:created', (block) => {
  console.log('Block created:', block);
});

editor.on('block:activated', (block) => {
  console.log('Block activated:', block);
});

editor.on('block:deactivated', (block) => {
  console.log('Block deactivated:', block);
});

editor.on('block:deleted', (block) => {
  console.log('Block deleted:', block);
});

editor.on('block:merged', (blocks) => {
  console.log('Blocks merged:', blocks);
});

editor.on('block:split', (originalBlock, newBlock) => {
  console.log('Block split:', originalBlock, newBlock);
});
```

## Examples

### Basic Text Block

```html
<div class="editor-block" data-block-type="text">
  <div class="block-content" contenteditable="true">
    This is a text block with editable content.
  </div>
</div>
```

### Container Block

```html
<div class="editor-block" data-block-type="container">
  <div class="block-content">
    <p>This is a container block that can hold other content.</p>
    <ul>
      <li>List item 1</li>
      <li>List item 2</li>
    </ul>
  </div>
</div>
```

### Styled Block

```html
<div class="editor-block" data-block-type="text" style="margin: 1rem 0; padding: 1rem; background-color: #f8f9fa; border-radius: 0.5rem;">
  <div class="block-content" contenteditable="true" style="font-size: 1.1rem; line-height: 1.6;">
    This is a styled text block with custom formatting.
  </div>
</div>
```

### Multiple Blocks

```html
<div class="editor-container">
  <div class="editor-block" data-block-type="text">
    <div class="block-content" contenteditable="true">
      First block content.
    </div>
  </div>
  
  <div class="editor-block" data-block-type="container">
    <div class="block-content">
      <h3>Container Block</h3>
      <p>This container holds structured content.</p>
    </div>
  </div>
  
  <div class="editor-block" data-block-type="text">
    <div class="block-content" contenteditable="true">
      Third block content.
    </div>
  </div>
</div>
```

## Block Navigation

### Keyboard Navigation
- **Tab**: Move to next block
- **Shift+Tab**: Move to previous block
- **Enter**: Create new block after current (in text blocks)
- **Backspace**: Merge with previous block if current is empty
- **Delete**: Merge with next block if current is empty

### Mouse Navigation
- **Click**: Activate block for editing
- **Double-click**: Select all content in block
- **Right-click**: Open context menu

## Block Resizing

Text blocks support interactive resizing:

```javascript
// Resize handles are automatically attached to text blocks
// Users can drag the handles to resize blocks
```

## Auto-merge Behavior

The plugin automatically merges empty adjacent blocks:

```javascript
// When a block becomes empty and focus moves away
// It's automatically merged with adjacent blocks
```

## Styling

### Default Styles

```css
.editor-block {
  position: relative;
  margin: 0.5rem 0;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.editor-block:hover {
  border-color: #e5e7eb;
}

.editor-block.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.block-content {
  padding: 0.5rem;
  min-height: 1.5rem;
}

.block-content[contenteditable="true"] {
  outline: none;
  cursor: text;
}

.block-content[contenteditable="true"]:focus {
  background-color: rgba(59, 130, 246, 0.05);
}
```

### Custom Styling

```css
/* Custom block styles */
.editor-block[data-block-type="text"] {
  background-color: #ffffff;
  border-radius: 0.375rem;
}

.editor-block[data-block-type="container"] {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
}

/* Block type indicators */
.editor-block::before {
  content: attr(data-block-type);
  position: absolute;
  top: -0.5rem;
  left: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  background-color: #ffffff;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
}
```

## Configuration Options

```javascript
const blockPlugin = new BlockPlugin();

// The plugin can be configured with custom options
// (Currently uses default configuration)
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, BlockPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new BlockPlugin());
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
import { HTMLEditor, BlockPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new BlockPlugin());
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
};
</script>
```

## Troubleshooting

### Common Issues

1. **Blocks not creating**
   - Check if plugin is properly initialized
   - Verify toolbar button is present
   - Check console for JavaScript errors

2. **Blocks not editable**
   - Ensure `contenteditable="true"` is set
   - Check for conflicting CSS styles
   - Verify block has correct class names

3. **Navigation not working**
   - Check keyboard event handlers
   - Ensure blocks have proper structure
   - Verify Tab key is not being intercepted

4. **Auto-merge not working**
   - Check if blocks are properly adjacent
   - Verify empty block detection logic
   - Ensure focus events are firing correctly

5. **Resize handles not appearing**
   - Make sure block is clicked to activate
   - Check for conflicting CSS styles
   - Verify Resizer component is initialized

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Block plugin initialized');

// Check block events
editor.on('block:created', (block) => {
  console.log('Block created:', block);
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Blocks are created on-demand
- Event delegation is used for efficiency
- Auto-merge is debounced to prevent excessive operations
- Resize handles are only attached when needed

## Accessibility

- Keyboard navigation support
- Screen reader friendly structure
- Proper ARIA attributes
- Focus management

## License

MIT License - see LICENSE file for details. 
