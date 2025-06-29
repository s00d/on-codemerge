# File Upload Plugin

The File Upload Plugin provides comprehensive file upload and management capabilities for the on-CodeMerge editor, supporting file uploads, downloads, and integration with external storage services.

## Features

- **File Upload**: Upload files with drag & drop support
- **File Download**: Download uploaded files with one click
- **File Type Validation**: Configurable allowed file types
- **File Size Limits**: Customizable maximum file size
- **Server Integration**: Real server endpoints or emulation mode
- **File Links**: Insert clickable file links in content
- **Progress Tracking**: Upload progress indication
- **Error Handling**: Comprehensive error management
- **Toolbar Integration**: Easy access via toolbar button
- **Keyboard Shortcuts**: Quick upload commands

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, FileUploadPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FileUploadPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['FileUploadPlugin']" />

## API Reference

### Plugin Configuration

```javascript
interface UploadConfig {
  endpoints?: {
    upload?: string;    // Upload endpoint URL
    download?: string;  // Download endpoint URL
  };
  maxFileSize?: number; // Maximum file size in bytes
  allowedTypes?: string[]; // Allowed MIME types
  useEmulation?: boolean;  // Use emulation mode
}

const fileUploadPlugin = new FileUploadPlugin({
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/*', 'application/pdf'],
  useEmulation: false,
  endpoints: {
    upload: 'https://api.example.com/upload',
    download: 'https://api.example.com/download'
  }
});
```

### File Upload Methods

```javascript
// Upload file
const file = new File(['content'], 'document.txt', { type: 'text/plain' });
const uploadedFile = await fileUploader.uploadFile(file);

// Download file
await fileUploader.downloadFile(fileId);

// Get file information
const fileInfo = fileUploader.getFile(fileId);

// Format file size
const formattedSize = fileUploader.formatFileSize(1024 * 1024); // "1.0 MB"
```

### File Operations

```javascript
// Insert file link in content
fileUploadPlugin.insertFileLink({
  id: 'file-123',
  name: 'document.pdf',
  size: 1024 * 1024
});

// Handle file link clicks
fileUploadPlugin.onFileLinkClick((fileId) => {
  console.log('File link clicked:', fileId);
});
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+U` | Upload file | `file-upload` |

## Supported File Types

### Default Configuration
- **Max File Size**: 10MB
- **Allowed Types**: All file types (`*/*`)
- **Mode**: Emulation (local storage)

### Common File Type Examples

```javascript
// Images
allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Documents
allowedTypes: ['application/pdf', 'text/plain', 'application/msword']

// Archives
allowedTypes: ['application/zip', 'application/x-rar-compressed']

// Media
allowedTypes: ['video/mp4', 'audio/mpeg', 'audio/wav']
```

## Events

```javascript
// Listen to file upload events
editor.on('file:upload-started', (file) => {
  console.log('Upload started:', file.name);
});

editor.on('file:upload-progress', (progress) => {
  console.log('Upload progress:', progress);
});

editor.on('file:upload-completed', (file) => {
  console.log('Upload completed:', file);
});

editor.on('file:upload-error', (error) => {
  console.error('Upload error:', error);
});

editor.on('file:download-started', (fileId) => {
  console.log('Download started:', fileId);
});

editor.on('file:download-completed', (fileId) => {
  console.log('Download completed:', fileId);
});
```

## Examples

### Basic File Upload

```javascript
// Simple file upload
const fileUploadPlugin = new FileUploadPlugin();
editor.use(fileUploadPlugin);

// Upload file programmatically
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const uploadedFile = await fileUploader.uploadFile(file);
      console.log('File uploaded:', uploadedFile);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }
};
```

### Server Integration

```javascript
// Configure with server endpoints
const fileUploadPlugin = new FileUploadPlugin({
  endpoints: {
    upload: 'https://api.example.com/upload',
    download: 'https://api.example.com/download'
  },
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image/*', 'application/pdf'],
  useEmulation: false
});

editor.use(fileUploadPlugin);
```

### Custom File Validation

```javascript
// Custom file validation
const customFileUploader = new FileUploader({
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png'],
  useEmulation: true
});

// Add custom validation
customFileUploader.validateFile = (file) => {
  if (file.name.includes('virus')) {
    throw new Error('Suspicious file name');
  }
  return true;
};
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, FileUploadPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      
      const fileUploadPlugin = new FileUploadPlugin({
        maxFileSize: 5 * 1024 * 1024,
        allowedTypes: ['image/*', 'application/pdf']
      });
      
      editorInstance.current.use(fileUploadPlugin);
      
      // Track upload progress
      editorInstance.current.on('file:upload-progress', (progress) => {
        setUploadProgress(progress);
      });
    }

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="upload-progress">
          Uploading: {uploadProgress}%
        </div>
      )}
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div class="upload-status" v-if="uploadStatus">
      {{ uploadStatus }}
    </div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import { HTMLEditor, FileUploadPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  data() {
    return {
      editor: null,
      uploadStatus: ''
    };
  },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    
    const fileUploadPlugin = new FileUploadPlugin({
      maxFileSize: 10 * 1024 * 1024,
      allowedTypes: ['*/*']
    });
    
    this.editor.use(fileUploadPlugin);
    
    // Track upload status
    this.editor.on('file:upload-started', () => {
      this.uploadStatus = 'Uploading...';
    });
    
    this.editor.on('file:upload-completed', () => {
      this.uploadStatus = 'Upload completed!';
      setTimeout(() => {
        this.uploadStatus = '';
      }, 3000);
    });
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
/* File upload menu */
.file-upload-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 400px;
}

/* File upload area */
.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.file-upload-area:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.file-upload-area.dragover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

/* File link */
.file-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-link:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

/* Upload progress */
.upload-progress {
  background-color: #3b82f6;
  height: 4px;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* File icon */
.file-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}
```

### Custom File Upload Themes

```css
/* Dark theme */
.file-upload-dark .file-upload-menu {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

.file-upload-dark .file-upload-area {
  border-color: #4b5563;
  background-color: #374151;
}

.file-upload-dark .file-upload-area:hover {
  border-color: #60a5fa;
  background-color: #1e3a8a;
}

/* Custom file types */
.file-link.pdf {
  background-color: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.file-link.image {
  background-color: #dbeafe;
  border-color: #3b82f6;
  color: #1e40af;
}

.file-link.document {
  background-color: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}
```

### Responsive File Upload Styles

```css
/* Mobile file upload styles */
@media (max-width: 768px) {
  .file-upload-menu {
    max-width: 90vw;
    margin: 0 16px;
  }
  
  .file-upload-area {
    padding: 30px 15px;
  }
  
  .file-link {
    padding: 12px 16px;
    font-size: 16px;
  }
}

/* Tablet file upload styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .file-upload-menu {
    max-width: 500px;
  }
}
```

## File Upload Structure

### Uploaded File Object

```javascript
interface UploadedFile {
  id: string;           // Unique file identifier
  name: string;         // Original file name
  size: number;         // File size in bytes
  type: string;         // MIME type
  data: ArrayBuffer;    // File data
}
```

### File Link HTML

```html
<a class="file-link" data-file-id="file-123">
  📎 document.pdf (1.2 MB)
</a>
```

## Troubleshooting

### Common Issues

1. **File upload not working**
   - Check file size limits
   - Verify allowed file types
   - Check for JavaScript errors
   - Ensure upload endpoints are configured

2. **File download not working**
   - Check if file exists in storage
   - Verify download permissions
   - Check for network errors
   - Ensure file ID is valid

3. **File type validation failing**
   - Check allowedTypes configuration
   - Verify MIME type detection
   - Check file extension validation
   - Ensure wildcard patterns are correct

4. **Server integration issues**
   - Check endpoint URLs
   - Verify server response format
   - Check CORS configuration
   - Ensure authentication is working

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('File Upload plugin initialized');

// Check upload events
editor.on('file:upload-started', (file) => {
  console.log('Upload started:', file);
});

editor.on('file:upload-error', (error) => {
  console.error('Upload error:', error);
});

// Check file uploader
const fileUploader = new FileUploader();
console.log('File uploader created');

// Test file validation
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
const isValid = fileUploader.isFileTypeAllowed(testFile);
console.log('File type allowed:', isValid);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- File uploads are asynchronous
- Large files are handled efficiently
- Progress tracking is optimized
- Memory usage is managed for large files

## Security

- File type validation prevents malicious uploads
- File size limits prevent abuse
- Server-side validation is recommended
- Secure file storage practices

## License

MIT License - see LICENSE file for details. 
