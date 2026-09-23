# Typography Plugin

The Typography Plugin provides advanced typography controls for the on-CodeMerge editor, offering font family selection, font size management, and typography styling options.

## Features

- **Font Family Selection**: Choose from various font families
- **Font Size Control**: Adjust text size with precision
- **Typography Styles**: Apply typography presets
- **Font Weight**: Control text weight (light, normal, bold)
- **Line Height**: Adjust line spacing
- **Letter Spacing**: Control character spacing
- **Text Transform**: Uppercase, lowercase, capitalize
- **Font Color**: Text color selection
- **Typography Presets**: Pre-defined typography styles
- **Custom Fonts**: Add custom font families

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, TypographyPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [TypographyPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['TypographyPlugin']" />

## Public API (v2)

Factory: `TypographyPlugin()`.

| Command          |                                    |
| ---------------- | ---------------------------------- |
| `typographyMenu` | `editor.command('typographyMenu')` |
| `setParagraph`   | `editor.command('setParagraph')`   |
| `setHeading1`    | `editor.command('setHeading1')`    |
| `setHeading2`    | `editor.command('setHeading2')`    |
| `setHeading3`    | `editor.command('setHeading3')`    |
| `setHeading4`    | `editor.command('setHeading4')`    |
| `setBlockquote`  | `editor.command('setBlockquote')`  |
| `insertHr`       | `editor.command('insertHr')`       |

### Keyboard shortcuts

| Shortcut      | Command          |
| ------------- | ---------------- |
| `Mod-Shift-w` | `typographyMenu` |

> **Note:** Command `typographyMenu` — no `createTypographyPreset`.

## Typography Presets

- **Heading 1**: Large heading style
- **Heading 2**: Medium heading style
- **Heading 3**: Small heading style
- **Body Text**: Standard body text
- **Caption**: Small caption text
- **Quote**: Blockquote style
- **Code**: Monospace code style

## Examples

### Basic Typography Usage

```javascript
// Initialize typography plugin
const editor = new Editor(container, {
  plugins: [TypographyPlugin()],
});

// Set typography properties
editor.setFontFamily('Georgia');
editor.setFontSize('18px');
editor.setFontWeight('bold');
editor.setLineHeight('1.6');
```

### Typography Presets

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { Editor, TypographyPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [typography, setTypography] = useState({});

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new Editor(editorRef.current);
      editorInstance.current.use(TypographyPlugin());

      editorInstance.current.on('typography:changed', (typography) => {
        setTypography(typography);
      });
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
    };
  }, []);

  return (
    <div>
      <div>Font: {typography.fontFamily}</div>
      <div>Size: {typography.fontSize}</div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div>Font: {{ typography.fontFamily }}</div>
    <div>Size: {{ typography.fontSize }}</div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { Editor, TypographyPlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, typography: {} }; },
  mounted() {
    this.editor = new Editor(this.$refs.editorContainer);
    this./* use plugins: [TypographyPlugin()] in Editor(...) */;

    this.editor.on('typography:changed', typography => {
      this.typography = typography;
    });
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.typography-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  min-width: 250px;
  max-height: 400px;
  overflow-y: auto;
}

.typography-section {
  margin-bottom: 16px;
}

.typography-section-title {
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.font-family-option {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.font-family-option:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.font-family-option.selected {
  background-color: #dbeafe;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.font-size-slider {
  width: 100%;
  margin: 8px 0;
}

.font-size-display {
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.typography-preset {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.typography-preset:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}
```

## Troubleshooting

1. **Fonts not loading**
   - Check font availability
   - Verify font loading
   - Check for network issues
   - Ensure proper font URLs

2. **Typography not applying**
   - Check selection range
   - Verify CSS specificity
   - Check for conflicts
   - Ensure proper initialization

3. **Presets not working**
   - Check preset definitions
   - Verify preset names
   - Check for JavaScript errors
   - Ensure proper configuration

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.
