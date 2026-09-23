# Image Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
