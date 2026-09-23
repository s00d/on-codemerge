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

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, FontPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [FontPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['FontPlugin']" />

## Public API (v2)

Factory: `FontPlugin()`.

| Command           |                                     |
| ----------------- | ----------------------------------- |
| `toggleBold`      | `editor.command('toggleBold')`      |
| `toggleItalic`    | `editor.command('toggleItalic')`    |
| `toggleUnderline` | `editor.command('toggleUnderline')` |
| `toggleStrike`    | `editor.command('toggleStrike')`    |

### Keyboard shortcuts

| Shortcut      | Command           |
| ------------- | ----------------- |
| `Mod-b`       | `toggleBold`      |
| `Mod-i`       | `toggleItalic`    |
| `Mod-u`       | `toggleUnderline` |
| `Mod-Shift-x` | `toggleStrike`    |

> **Note:** Popup for family/size/line-height. Mark toggles overlap ToolbarPlugin — avoid duplicate toolbar ids. No `getAvailableFonts`.

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
import { Editor, FontPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new Editor(editorRef.current);
      editorInstance.current.use(FontPlugin());

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
import { Editor, FontPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new Editor(this.$refs.editorContainer);
    this./* use plugins: [FontPlugin()] in Editor(...) */;
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

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.
