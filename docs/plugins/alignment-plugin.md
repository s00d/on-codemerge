# Alignment Plugin

The Alignment Plugin provides text alignment functionality for the on-CodeMerge editor, allowing users to align text left, center, right, or justify it with toolbar buttons and visual feedback.

## Features

- **Text Alignment**: Left, center, right, and justify alignment
- **Toolbar Integration**: Easy access via toolbar buttons
- **Visual Feedback**: Active state indication for current alignment
- **Keyboard Shortcuts**: Quick alignment commands
- **Selection Awareness**: Automatic detection of current alignment
- **Toggle Functionality**: Toggle alignment on/off
- **Real-time Updates**: Immediate visual feedback

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, AlignmentPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new AlignmentPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['AlignmentPlugin']" />

## API Reference

### Alignment Commands

```javascript
// Align text left
editor.executeCommand('align_left');

// Align text center
editor.executeCommand('align_center');

// Align text right
editor.executeCommand('align_right');

// Justify text
editor.executeCommand('align_justify');

// Toggle alignment style
editor.getTextFormatter()?.toggleStyle('alignLeft');
editor.getTextFormatter()?.toggleStyle('alignCenter');
editor.getTextFormatter()?.toggleStyle('alignRight');
editor.getTextFormatter()?.toggleStyle('alignJustify');
```

### Alignment Detection

```javascript
// Check if alignment is applied
const isLeftAligned = editor.getTextFormatter()?.hasClass('alignLeft');
const isCenterAligned = editor.getTextFormatter()?.hasClass('alignCenter');
const isRightAligned = editor.getTextFormatter()?.hasClass('alignRight');
const isJustified = editor.getTextFormatter()?.hasClass('alignJustify');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+B` | Bold text | `bold` |
| `Ctrl+I` | Italic text | `italic` |
| `Ctrl+U` | Underline text | `underline` |
| `Ctrl+Shift+S` | Strikethrough text | `strikethrough` |

## Alignment Types

### Left Alignment
```html
<div style="text-align: left;">
  This text is left-aligned
</div>
```

### Center Alignment
```html
<div style="text-align: center;">
  This text is center-aligned
</div>
```

### Right Alignment
```html
<div style="text-align: right;">
  This text is right-aligned
</div>
```

### Justify Alignment
```html
<div style="text-align: justify;">
  This text is justified and will spread across the full width
</div>
```

## Events

```javascript
// Listen to alignment events
editor.on('align_left', () => {
  console.log('Text aligned left');
});

editor.on('align_center', () => {
  console.log('Text aligned center');
});

editor.on('align_right', () => {
  console.log('Text aligned right');
});

editor.on('align_justify', () => {
  console.log('Text justified');
});

editor.on('selectionchange', () => {
  console.log('Selection changed, updating alignment state');
});
```

## Examples

### Basic Alignment Usage

```html
<!-- Left aligned text -->
<p style="text-align: left;">This paragraph is left-aligned.</p>

<!-- Center aligned text -->
<p style="text-align: center;">This paragraph is center-aligned.</p>

<!-- Right aligned text -->
<p style="text-align: right;">This paragraph is right-aligned.</p>

<!-- Justified text -->
<p style="text-align: justify;">This paragraph is justified and will spread across the full width of the container.</p>
```

### Mixed Alignment

```html
<div>
  <h1 style="text-align: center;">Centered Title</h1>
  <p style="text-align: left;">Left-aligned paragraph content.</p>
  <p style="text-align: justify;">Justified paragraph that spreads across the full width.</p>
  <div style="text-align: right;">Right-aligned footer content</div>
</div>
```

### Responsive Alignment

```html
<div class="responsive-container">
  <p style="text-align: left;" class="mobile-center">
    This text is left-aligned on desktop but center-aligned on mobile.
  </p>
</div>
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, AlignmentPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new AlignmentPlugin());
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
import { HTMLEditor, AlignmentPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new AlignmentPlugin());
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
/* Alignment button styles */
.toolbar-button {
  padding: 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-button:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.toolbar-button.active {
  background-color: #3b82f6;
  color: white;
  border-color: #1d4ed8;
}

/* Text alignment styles */
.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-justify {
  text-align: justify;
}
```

### Custom Alignment Styles

```css
/* Custom alignment themes */
.alignment-dark .toolbar-button.active {
  background-color: #1f2937;
  border-color: #374151;
}

.alignment-light .toolbar-button.active {
  background-color: #ffffff;
  border-color: #e5e7eb;
  color: #374151;
}

/* Custom alignment indicators */
.alignment-indicator {
  position: relative;
}

.alignment-indicator::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid currentColor;
}
```

### Responsive Alignment

```css
/* Mobile-first alignment */
@media (max-width: 768px) {
  .mobile-center {
    text-align: center !important;
  }
  
  .mobile-left {
    text-align: left !important;
  }
}

/* Tablet alignment */
@media (min-width: 769px) and (max-width: 1024px) {
  .tablet-justify {
    text-align: justify !important;
  }
}
```

## Alignment Classes

The plugin uses CSS classes for alignment:

```css
/* Alignment classes */
.alignLeft {
  text-align: left;
}

.alignCenter {
  text-align: center;
}

.alignRight {
  text-align: right;
}

.alignJustify {
  text-align: justify;
}
```

## Troubleshooting

### Common Issues

1. **Alignment not applying**
   - Check if text is selected before applying alignment
   - Verify TextFormatter is available
   - Check for conflicting CSS styles

2. **Active state not updating**
   - Ensure selection change events are working
   - Check if hasClass method is implemented
   - Verify button state management

3. **Alignment buttons not showing**
   - Check if toolbar exists in DOM
   - Verify plugin initialization
   - Check for JavaScript errors

4. **Alignment not persisting**
   - Check if styles are being saved properly
   - Verify content serialization
   - Check for style conflicts

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Alignment plugin initialized');

// Check alignment events
editor.on('align_left', () => {
  console.log('Left alignment applied');
});

// Check selection changes
editor.on('selectionchange', () => {
  console.log('Selection changed, checking alignment state');
});

// Check alignment classes
const hasLeftAlign = editor.getTextFormatter()?.hasClass('alignLeft');
console.log('Has left alignment:', hasLeftAlign);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Alignment detection is optimized
- Selection change events are debounced
- Button state updates are efficient
- CSS classes are used for performance

## Accessibility

- Screen reader support for alignment buttons
- Keyboard navigation for alignment controls
- Proper ARIA labels for alignment states
- High contrast alignment indicators

## License

MIT License - see LICENSE file for details. 
