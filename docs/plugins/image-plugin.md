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

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, ImagePlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [ImagePlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent
  :activePlugins="['ImagePlugin']"
  :showDescription="false"
  :showResults="false"
/>

## Public API (v2)

Factory: `ImagePlugin(config?)` — `Partial<UploadConfig> & PluginToolbarOpts`.

| Command       |                                 |
| ------------- | ------------------------------- |
| `insertImage` | `editor.command('insertImage')` |

### Keyboard shortcuts

| Shortcut    | Command       |
| ----------- | ------------- |
| `Mod-Alt-i` | `insertImage` |

Insert opens a modal: upload / drop (and **Gallery** when `endpoints.list` is set) → crop + alt / align / size → Insert. Gallery supports delete when `endpoints.delete` is set (`DELETE {delete}/{id}`). Cropped pixels are `POST`ed to `endpoints.upload` when configured (`useEmulation: false`); otherwise a data URL is stored on the atom.

```ts
ImagePlugin({
  endpoints: {
    upload: '/api/media/upload',
    list: '/api/media/images', // optional gallery
    delete: '/api/media', // optional DELETE {delete}/{id}
  },
  headers: { Authorization: 'Bearer …' },
  maxFileSize: 5 * 1024 * 1024,
  useEmulation: false,
});
```

**Contracts**

- `GET list` → `{ items: [{ id, name, url, size?, mime?, thumbUrl? }] }`
- `POST upload` multipart `file` → `{ id, name, url, size?, mime? }`

Drop on the editor stages the file in the same modal (not an instant insert). Context menu **Edit** / **Change image** reopen the modal.

## Image Resizing

Images automatically get resize handles when clicked:

```javascript
// The plugin automatically attaches ResizableElement to images
// Users can drag the handles to resize images interactively
```

## Examples

### Basic Image

```html
<img
  src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  alt="Sample Image"
  class="max-w-full h-auto rounded-lg"
/>
```

### Aligned Image

```html
<!-- Left aligned -->
<img
  src="image.jpg"
  alt="Left aligned image"
  style="float: left; margin-right: 1rem; max-width: 100%; height: auto; border-radius: 0.5rem;"
/>

<!-- Center aligned -->
<img
  src="image.jpg"
  alt="Center aligned image"
  style="float: none; display: block; margin-left: auto; margin-right: auto; max-width: 100%; height: auto; border-radius: 0.5rem;"
/>

<!-- Right aligned -->
<img
  src="image.jpg"
  alt="Right aligned image"
  style="float: right; margin-left: 1rem; max-width: 100%; height: auto; border-radius: 0.5rem;"
/>
```

### Responsive Image

```html
<img
  src="image.jpg"
  alt="Responsive image"
  class="max-w-full h-auto rounded-lg"
  style="max-width: 100%; height: auto;"
/>
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

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { Editor, ImagePlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new Editor(editorRef.current);
      editorInstance.current.use(ImagePlugin());
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
import { Editor, ImagePlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new Editor(this.$refs.editorContainer);
    this./* use plugins: [ImagePlugin()] in Editor(...) */;
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
