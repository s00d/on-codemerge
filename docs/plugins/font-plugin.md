# Font Plugin

The Font Plugin provides comprehensive typography control for the on-CodeMerge editor, allowing users to change font families, sizes, line heights, and apply text formatting styles.

## Features

- **Font Family Selection**: Choose from 35+ predefined fonts
- **Font Size Control**: 65+ size options from 8px to 72px
- **Line Height Adjustment**: 12 line height options
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Dynamic Font Detection**: Auto-detects loaded web fonts
- **Visual Feedback**: Active state indication for applied styles
- **Toolbar Integration**: Easy access via toolbar buttons
- **Keyboard Shortcuts**: Quick font style commands
- **Font Settings Popup**: Comprehensive font configuration

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, FontPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FontPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['FontPlugin']" />

## API Reference

### Font Methods

```javascript
// Apply font settings
editor.getTextFormatter()?.setFont(family, size, lineHeight);

// Get current font style
const fontFamily = editor.getTextFormatter()?.getStyle('fontFamily');
const fontSize = editor.getTextFormatter()?.getStyle('fontSize');
const lineHeight = editor.getTextFormatter()?.getStyle('lineHeight');

// Clear font settings
editor.getTextFormatter()?.clearFont();

// Toggle text styles
editor.getTextFormatter()?.toggleStyle('bold');
editor.getTextFormatter()?.toggleStyle('italic');
editor.getTextFormatter()?.toggleStyle('underline');
editor.getTextFormatter()?.toggleStyle('strikethrough');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+F` | Font settings | `font-style` |

## Available Fonts

### Default Font Families
- Arial, Arial Black, Verdana, Tahoma
- Trebuchet MS, Times New Roman, Georgia
- Garamond, Courier New, Brush Script MT
- Comic Sans MS, Impact, Lucida Console
- Palatino, Bookman, Avant Garde, Courier
- Helvetica, Geneva, Optima, Futura
- Baskerville, Didot, American Typewriter
- Andale Mono, Monaco, Bradley Hand
- Chalkduster, Copperplate, Papyrus
- Trattatello, Snell Roundhand, Zapfino
- Herculanum

### Font Sizes
8px to 72px in 1px increments

### Line Heights
- normal, 0.75, 1, 1.15, 1.25, 1.35
- 1.5, 1.75, 2, 2.5, 3, 16px

## Events

```javascript
// Listen to font events
editor.on('font:changed', (fontFamily, fontSize, lineHeight) => {
  console.log('Font changed:', fontFamily, fontSize, lineHeight);
});

editor.on('style:applied', (style) => {
  console.log('Style applied:', style);
});

editor.on('style:removed', (style) => {
  console.log('Style removed:', style);
});
```

## Examples

### Basic Font Usage

```html
<!-- Different font families -->
<p style="font-family: Arial;">Arial text</p>
<p style="font-family: Times New Roman;">Times New Roman text</p>
<p style="font-family: Georgia;">Georgia text</p>

<!-- Different font sizes -->
<p style="font-size: 12px;">Small text</p>
<p style="font-size: 16px;">Normal text</p>
<p style="font-size: 24px;">Large text</p>

<!-- Different line heights -->
<p style="line-height: 1.5;">Text with 1.5 line height</p>
<p style="line-height: 2;">Text with double line height</p>
```

### Text Formatting

```html
<!-- Bold text -->
<p><strong>Bold text</strong></p>

<!-- Italic text -->
<p><em>Italic text</em></p>

<!-- Underlined text -->
<p><u>Underlined text</u></p>

<!-- Strikethrough text -->
<p><s>Strikethrough text</s></p>
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, FontPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new FontPlugin());
      
      // Listen to font changes
      editorInstance.current.on('font:changed', (family, size, lineHeight) => {
        console.log('Font updated:', family, size, lineHeight);
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
import { HTMLEditor, FontPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new FontPlugin());
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
/* Font popup */
.font-popup {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 400px;
}

/* Font buttons */
.font-button {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.font-button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.font-button.active {
  background-color: #3b82f6;
  color: white;
  border-color: #1d4ed8;
}

/* Font preview */
.font-preview {
  font-family: inherit;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 12px;
}
```

## Troubleshooting

### Common Issues

1. **Font not applying**
   - Check if font is available in system
   - Verify font family name is correct
   - Check for CSS conflicts
   - Ensure text is selected

2. **Font size not changing**
   - Verify size value is valid
   - Check for CSS specificity issues
   - Ensure text formatter is working
   - Check for JavaScript errors

3. **Styles not toggling**
   - Check if text is selected
   - Verify style names are correct
   - Check for event handler issues
   - Ensure toolbar buttons are working

### Debug Mode

```javascript
// Add console logging
console.log('Font plugin initialized');

// Check font detection
const availableFonts = fontPlugin.getAvailableFonts();
console.log('Available fonts:', availableFonts);

// Check current styles
const currentFont = editor.getTextFormatter()?.getStyle('fontFamily');
console.log('Current font:', currentFont);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
