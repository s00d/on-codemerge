# Block Style Plugin

The Block Style Plugin provides comprehensive styling capabilities for block elements in the on-CodeMerge editor, allowing users to apply custom CSS styles and classes to selected elements.

## Features

- **Block Element Detection**: Automatic detection of block-level elements
- **Style Editor**: Visual interface for applying CSS styles
- **Class Management**: Add and remove CSS classes
- **Property Selection**: Choose from predefined CSS properties
- **Value Selection**: Select from predefined values for each property
- **Real-time Preview**: See style changes immediately
- **Toolbar Integration**: Easy access via toolbar button
- **Active State**: Visual feedback when block is selected

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, BlockStylePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new BlockStylePlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['BlockStylePlugin']" />

## API Reference

### Block Detection

```javascript
// Check if element is a block element
const isBlock = blockStylePlugin.isBlockElement(element);

// Get selected block element
const selectedBlock = blockStylePlugin.getSelectedElement();

// Check if block is currently selected
const hasBlockSelected = blockStylePlugin.hasBlockSelected();
```

### Style Management

```javascript
// Apply styles to selected block
blockStylePlugin.applyStyles(styles);

// Add CSS class to block
blockStylePlugin.addClass(className);

// Remove CSS class from block
blockStylePlugin.removeClass(className);

// Get current styles of block
const currentStyles = blockStylePlugin.getCurrentStyles();
```

## Available CSS Properties

### Colors
- `color` - Text color
- `background-color` - Background color

### Typography
- `font-size` - Font size (8px to 72px)
- `font-weight` - Font weight (normal, bold, 100-900)

### Layout
- `text-align` - Text alignment
- `margin-top`, `margin-right`, `margin-bottom`, `margin-left` - Margins
- `padding-top`, `padding-right`, `padding-bottom`, `padding-left` - Padding

### Borders
- `border-style` - Border style (solid, dashed, dotted, etc.)
- `border-width` - Border width (1px to 10px, thin, medium, thick)
- `border-color` - Border color

### Positioning
- `position` - Position type
- `top`, `right`, `bottom`, `left` - Position values
- `z-index` - Z-index value

### Display
- `display` - Display type
- `float` - Float property
- `clear` - Clear property

### Dimensions
- `width`, `height` - Element dimensions
- `min-width`, `min-height` - Minimum dimensions
- `max-width`, `max-height` - Maximum dimensions

## Events

```javascript
// Listen to block selection events
editor.on('block:selected', (element) => {
  console.log('Block selected:', element);
});

editor.on('block:deselected', () => {
  console.log('Block deselected');
});

editor.on('styles:applied', (styles) => {
  console.log('Styles applied:', styles);
});

editor.on('class:added', (className) => {
  console.log('Class added:', className);
});

editor.on('class:removed', (className) => {
  console.log('Class removed:', className);
});
```

## Examples

### Basic Block Styling

```html
<!-- Styled paragraph -->
<p style="color: blue; font-size: 18px; text-align: center;">
  This is a styled paragraph
</p>

<!-- Styled div with background -->
<div style="background-color: lightgray; padding: 20px; border: 2px solid black;">
  This div has custom styling
</div>
```

### Block with CSS Classes

```html
<!-- Block with custom class -->
<div class="custom-block">
  This block uses a CSS class
</div>

<!-- Multiple classes -->
<p class="highlighted important">
  This paragraph has multiple classes
</p>
```

### Complex Block Styling

```html
<!-- Complex styled block -->
<section style="
  background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
  border-radius: 10px;
  padding: 20px;
  margin: 15px 0;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #007bff;
">
  <h2 style="color: #333; margin-bottom: 15px;">Styled Section</h2>
  <p style="line-height: 1.6; color: #666;">
    This section demonstrates complex styling capabilities.
  </p>
</section>
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, BlockStylePlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new BlockStylePlugin());
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
import { HTMLEditor, BlockStylePlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new BlockStylePlugin());
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
/* Block style editor popup */
.block-style-editor {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

/* Style property selector */
.style-property {
  margin-bottom: 1rem;
}

.style-property label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.style-property select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background-color: white;
}

/* Value selector */
.style-value {
  margin-left: 1rem;
}

/* Class management */
.class-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.5rem;
}

.class-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.class-item:last-child {
  border-bottom: none;
}
```

### Custom Block Styles

```css
/* Custom block themes */
.block-style-dark {
  background-color: #1f2937;
  color: #f9fafb;
}

.block-style-light {
  background-color: #ffffff;
  color: #374151;
}

/* Custom block indicators */
.block-indicator {
  position: relative;
}

.block-indicator::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #3b82f6;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.block-indicator:hover::before {
  opacity: 1;
}
```

### Responsive Block Styles

```css
/* Mobile-first block styles */
@media (max-width: 768px) {
  .block-style-editor {
    max-width: 100%;
    margin: 0 1rem;
  }
  
  .style-property {
    flex-direction: column;
  }
  
  .style-value {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}

/* Tablet block styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .block-style-editor {
    max-width: 600px;
  }
}
```

## Block Element Types

The plugin recognizes these block-level elements:

### Text Elements
- `p`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- `blockquote`, `pre`, `address`

### Container Elements
- `div`, `section`, `article`, `header`, `footer`
- `nav`, `aside`, `main`, `figure`, `figcaption`

### List Elements
- `ul`, `ol`, `li`, `dl`, `dt`, `dd`

### Table Elements
- `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`

### Form Elements
- `form`, `fieldset`, `legend`

### Other Elements
- `hr`, `menu`, `dialog`, `iframe`, `canvas`
- `video`, `audio`, `picture`, `object`, `embed`

## Troubleshooting

### Common Issues

1. **Block not detected**
   - Check if element is in the supported block list
   - Verify element is properly selected
   - Check for JavaScript errors

2. **Styles not applying**
   - Ensure block is selected before applying styles
   - Check for CSS conflicts
   - Verify style property and value are valid

3. **Popup not opening**
   - Check if toolbar button exists
   - Verify plugin initialization
   - Check for popup manager errors

4. **Classes not working**
   - Ensure CSS classes are defined in stylesheet
   - Check for class name conflicts
   - Verify class addition/removal logic

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Block Style plugin initialized');

// Check block selection
editor.on('block:selected', (element) => {
  console.log('Block selected:', element.tagName, element);
});

// Check style application
editor.on('styles:applied', (styles) => {
  console.log('Styles applied:', styles);
});

// Check current block
const selectedBlock = blockStylePlugin.getSelectedElement();
console.log('Current selected block:', selectedBlock);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Block detection is optimized
- Style application is efficient
- Popup creation is lazy-loaded
- CSS property validation is cached

## Accessibility

- Screen reader support for style controls
- Keyboard navigation for style selection
- Proper ARIA labels for style properties
- High contrast style indicators

## License

MIT License - see LICENSE file for details. 
