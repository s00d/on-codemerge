# Color Plugin

The Color Plugin provides comprehensive color management capabilities for the on-CodeMerge editor, including text color, background color, and a sophisticated color picker with recent colors.

## Features

- **Text Color**: Change text color with color picker
- **Background Color**: Apply background color to text
- **Color Picker**: Advanced color selection interface
- **Recent Colors**: Remember and reuse recently used colors
- **Default Colors**: Predefined color palette
- **Custom Colors**: RGB color picker for custom colors
- **Keyboard Shortcuts**: Quick access to color functions
- **Toolbar Integration**: Easy access via toolbar buttons
- **Color Persistence**: Save recent colors in localStorage

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ColorPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ColorPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ColorPlugin']" />

## API Reference

### Color Operations

```javascript
// Change text color
editor.executeCommand('fore-color');

// Change background color
editor.executeCommand('hilite-color');

// Set text color programmatically
editor.getTextFormatter()?.setColor('#FF0000');

// Set background color programmatically
editor.getTextFormatter()?.setBackgroundColor('#FFFF00');
```

### Color Picker

```javascript
// Show text color picker
colorPlugin.showTextColorPicker();

// Show background color picker
colorPlugin.showBgColorPicker();

// Get recent colors
const recentColors = JSON.parse(localStorage.getItem('html-editor-recent-colors') || '[]');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+Q` | Change text color | `fore-color` |
| `Ctrl+Shift+H` | Highlight text (background color) | `hilite-color` |

## Available Colors

### Default Color Palette
The plugin includes 16 predefined colors:

```javascript
const COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#808080', // Gray
  '#800000', // Maroon
  '#808000', // Olive
  '#008000', // Dark Green
  '#800080', // Purple
  '#008080', // Teal
  '#000080', // Navy
  '#FFA500', // Orange
];
```

### Custom Colors
Users can select any custom color using the RGB color picker.

### Recent Colors
The plugin automatically saves up to 8 recently used colors in localStorage.

## Color Picker Interface

### Recent Colors Section
- Shows up to 8 recently used colors
- Automatically updated when new colors are selected
- Persistent across browser sessions

### Default Colors Section
- Grid of 16 predefined colors
- Quick access to common colors
- Visual color preview

### Custom Color Section
- RGB color picker
- Hex color input
- Real-time color preview

## Events

```javascript
// Listen to color events
editor.on('color:applied', (color, type) => {
  console.log('Color applied:', color, type);
});

editor.on('color:changed', (oldColor, newColor) => {
  console.log('Color changed:', oldColor, newColor);
});

editor.on('recent-colors:updated', (colors) => {
  console.log('Recent colors updated:', colors);
});
```

## Examples

### Basic Text Coloring

```html
<span style="color: #FF0000;">Red text</span>
<span style="color: #00FF00;">Green text</span>
<span style="color: #0000FF;">Blue text</span>
```

### Background Highlighting

```html
<span style="background-color: #FFFF00;">Highlighted text</span>
<span style="background-color: #FFE4E1;">Light pink background</span>
<span style="background-color: #E6F3FF;">Light blue background</span>
```

### Combined Colors

```html
<span style="color: #FFFFFF; background-color: #000000;">White text on black background</span>
<span style="color: #000000; background-color: #FFFF00;">Black text on yellow background</span>
```

### Custom Styled Text

```html
<div style="color: #800080; background-color: #F0F8FF;">
  Purple text with light blue background
</div>
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, ColorPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ColorPlugin());
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
import { HTMLEditor, ColorPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ColorPlugin());
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
/* Color picker container */
.color-picker {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Color grid */
.color-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
  padding: 1rem;
}

/* Color button */
.color-button {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.color-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Recent colors section */
.recent-colors {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

/* Custom color picker */
.custom-color-picker {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}
```

### Custom Color Themes

```css
/* Dark theme */
.color-picker.dark-theme {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

/* Custom color palette */
.custom-palette .color-button {
  border-radius: 50%;
  border: 2px solid transparent;
}

.custom-palette .color-button:hover {
  border-color: #3b82f6;
}

/* High contrast mode */
.high-contrast .color-button {
  border: 2px solid #000000;
}

.high-contrast .color-button:hover {
  border-color: #ffffff;
}
```

## Color Management

### Recent Colors Storage
```javascript
// Recent colors are stored in localStorage
const RECENT_COLORS_KEY = 'html-editor-recent-colors';

// Load recent colors
const recentColors = JSON.parse(localStorage.getItem(RECENT_COLORS_KEY) || '[]');

// Save recent colors
localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(['#FF0000', '#00FF00', '#0000FF']));
```

### Color Validation
```javascript
// Validate hex color
function isValidHexColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Convert Hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
```

## Troubleshooting

### Common Issues

1. **Color picker not opening**
   - Check if plugin is properly initialized
   - Verify toolbar buttons are present
   - Check console for JavaScript errors

2. **Colors not applying**
   - Ensure text is selected before applying color
   - Check if TextFormatter is available
   - Verify color format is correct

3. **Recent colors not saving**
   - Check if localStorage is available
   - Verify browser permissions
   - Check for localStorage errors

4. **Color picker not closing**
   - Check if popup manager is working
   - Verify click outside handler
   - Ensure proper cleanup

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Color plugin initialized');

// Check color events
editor.on('color:applied', (color, type) => {
  console.log('Color applied:', color, type);
});

// Check recent colors
const recentColors = localStorage.getItem('html-editor-recent-colors');
console.log('Recent colors:', recentColors);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Color picker is created on-demand
- Recent colors are cached in localStorage
- Color validation is lightweight
- Popup management is optimized

## Accessibility

- Screen reader support for color names
- Keyboard navigation for color selection
- High contrast color themes
- Proper ARIA labels for color buttons

## License

MIT License - see LICENSE file for details. 
