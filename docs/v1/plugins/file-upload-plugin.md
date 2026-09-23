# File Upload Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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

_…trimmed for the v1 archive. See source history for the full guide._
