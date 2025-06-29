# Image Plugin

The Image Plugin provides comprehensive image management capabilities for the on-CodeMerge editor, including image upload, resizing, alignment, and context menu operations.

## Features

- **Image Upload**: Upload images from local files
- **Drag & Drop**: Support for drag and drop image uploads
- **Image Resizing**: Interactive resizing with handles
- **Image Alignment**: Left, center, and right alignment options
- **Context Menu**: Right-click for quick image operations
- **File Type Support**: All common image formats (JPEG, PNG, GIF, WebP, etc.)
- **Responsive Images**: Automatic responsive behavior

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ImagePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ImagePlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['ImagePlugin']" />

## API Reference

### Image Upload

```javascript
// Insert image programmatically
editor.executeCommand('image', {
  src: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
  alt: 'My Image',
  className: 'max-w-full h-auto rounded-lg'
});

// Handle file drop event
editor.on('file-drop', (e) => {
  if (e.type.startsWith('image/')) {
    // Image will be automatically inserted
    console.log('Image dropped:', e.content);
  }
});
```

### Image Operations

```javascript
// Get all images in editor
const images = editor.getContainer().querySelectorAll('img');

// Set image properties
const image = document.querySelector('img');
image.style.float = 'left';
image.style.marginRight = '1rem';
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+I` | Insert image | `image` |

## Context Menu

Right-click on an image to access:

### Alignment Options
- **Align Left**: Float image to the left with right margin
- **Align Center**: Center image with auto margins
- **Align Right**: Float image to the right with left margin

### Image Operations
- **Remove**: Delete the image from the editor

## Image Upload Process

The plugin handles image upload through several methods:

### 1. Toolbar Button
Click the image button in the toolbar to open file selection dialog.

### 2. Drag & Drop
Drag image files directly into the editor area.

### 3. Programmatic Upload
Use the API to insert images programmatically.

## Image Resizing

Images automatically get resize handles when clicked:

```javascript
// The plugin automatically attaches ResizableElement to images
// Users can drag the handles to resize images interactively
```

## File Upload Configuration

The plugin uses `ImageUploader` service for file handling:

```javascript
// File selection
const file = await imageUploader.selectFile();
// Returns File object or null if cancelled

// File reading
const dataUrl = await imageUploader.readFileAsDataUrl(file);
// Returns base64 data URL
```

## Events

```javascript
// Listen to image events
editor.on('image:inserted', (image) => {
  console.log('Image inserted:', image);
});

editor.on('image:removed', (image) => {
  console.log('Image removed:', image);
});

editor.on('image:resized', (image, dimensions) => {
  console.log('Image resized:', image, dimensions);
});

// File drop events
editor.on('file-drop', (e) => {
  if (e.type.startsWith('image/')) {
    console.log('Image file dropped:', e.content);
  }
});
```

## Examples

### Basic Image

```html
<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." 
     alt="Sample Image" 
     class="max-w-full h-auto rounded-lg">
```

### Aligned Image

```html
<!-- Left aligned -->
<img src="image.jpg" 
     alt="Left aligned image" 
     style="float: left; margin-right: 1rem; max-width: 100%; height: auto; border-radius: 0.5rem;">

<!-- Center aligned -->
<img src="image.jpg" 
     alt="Center aligned image" 
     style="float: none; display: block; margin-left: auto; margin-right: auto; max-width: 100%; height: auto; border-radius: 0.5rem;">

<!-- Right aligned -->
<img src="image.jpg" 
     alt="Right aligned image" 
     style="float: right; margin-left: 1rem; max-width: 100%; height: auto; border-radius: 0.5rem;">
```

### Responsive Image

```html
<img src="image.jpg" 
     alt="Responsive image" 
     class="max-w-full h-auto rounded-lg"
     style="max-width: 100%; height: auto;">
```

## Image Formats Support

The plugin supports all common image formats:

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)
- **SVG** (.svg) - Note: SVG images are excluded from context menu
- **BMP** (.bmp)
- **TIFF** (.tiff, .tif)

## Styling

### Default Styles

Images get the following default classes:
- `max-w-full` - Maximum width 100%
- `h-auto` - Automatic height
- `rounded-lg` - Rounded corners

### Custom Styling

```css
/* Custom image styles */
.html-editor img {
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
}

.html-editor img:hover {
  border-color: #3b82f6;
  transform: scale(1.02);
}

/* Resize handle styles */
.image-resize-handle {
  background: #3b82f6;
  border: 2px solid white;
  border-radius: 50%;
  width: 8px;
  height: 8px;
}
```

## Configuration Options

```javascript
const imagePlugin = new ImagePlugin();

// The plugin can be configured with custom options
// (Currently uses default configuration)
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, ImagePlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new ImagePlugin());
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
import { HTMLEditor, ImagePlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new ImagePlugin());
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

1. **Images not uploading**
   - Check file permissions
   - Ensure file is a valid image format
   - Check browser console for errors

2. **Images not displaying**
   - Verify image URL is accessible
   - Check CORS settings for external images
   - Ensure image format is supported

3. **Resize handles not appearing**
   - Make sure image is clicked to activate
   - Check for conflicting CSS styles
   - Verify ResizableElement is properly initialized

4. **Context menu not working**
   - Ensure image doesn't have `svg-img` or `svg-chart` classes
   - Check for event handler conflicts
   - Verify ContextMenu component is initialized

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Image plugin initialized');

// Check file upload
editor.on('file-drop', (e) => {
  console.log('File drop event:', e);
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Large images are automatically resized to fit the editor
- Base64 encoding is used for local file uploads
- Images are optimized for web display
- Lazy loading can be implemented for better performance

## Security

- File type validation prevents malicious uploads
- Image files are read as data URLs
- No server-side processing required
- CORS policies apply to external images

## License

MIT License - see LICENSE file for details. 
MIT License - see LICENSE file for details. 
