# Video Plugin

The Video Plugin provides video embedding and management capabilities for the on-CodeMerge editor, allowing users to insert, edit, and manage video content within their documents.

## Features

- **Video Upload**: Upload video files directly
- **Video Embedding**: Embed videos from URLs
- **Video Preview**: Preview videos before insertion
- **Video Controls**: Play, pause, volume controls
- **Video Formatting**: Resize and position videos
- **Video Captions**: Add captions and descriptions
- **Video Thumbnails**: Custom thumbnail selection
- **Video Responsive**: Responsive video display
- **Video Context Menu**: Right-click video options
- **Video Validation**: File type and size validation

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, VideoPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new VideoPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['VideoPlugin']" />

## API Reference

### Video Methods

```javascript
// Insert video from URL
editor.insertVideo(url, options);

// Upload video file
editor.uploadVideo(file);

// Get video info
const videoInfo = editor.getVideoInfo(videoId);

// Update video properties
editor.updateVideo(videoId, properties);

// Remove video
editor.removeVideo(videoId);

// Get all videos
const videos = editor.getVideos();
```

## Supported Video Formats

- **MP4**: Most common format
- **WebM**: Web-optimized format
- **OGG**: Open source format
- **AVI**: Legacy format
- **MOV**: Apple format
- **WMV**: Windows format

## Events

```javascript
// Listen to video events
editor.on('video:inserted', (video) => {
  console.log('Video inserted:', video);
});

editor.on('video:uploaded', (video) => {
  console.log('Video uploaded:', video);
});

editor.on('video:removed', (videoId) => {
  console.log('Video removed:', videoId);
});

editor.on('video:error', (error) => {
  console.log('Video error:', error);
});
```

## Examples

### Basic Video Usage

```javascript
// Initialize video plugin
const editor = new HTMLEditor(container);
editor.use(new VideoPlugin());

// Insert video from URL
editor.insertVideo('https://example.com/video.mp4', {
  width: '100%',
  height: '300px',
  autoplay: false,
  controls: true
});

// Upload video file
const fileInput = document.getElementById('video-file');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  editor.uploadVideo(file);
});
```

### Video Configuration

```javascript
// Configure video plugin
const videoPlugin = new VideoPlugin({
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFormats: ['mp4', 'webm', 'ogg'],
  uploadUrl: '/api/upload-video',
  thumbnailGenerator: true,
  autoResize: true
});

editor.use(videoPlugin);
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, VideoPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new VideoPlugin());
      
      editorInstance.current.on('video:inserted', (video) => {
        setVideos(prev => [...prev, video]);
      });
      
      editorInstance.current.on('video:removed', (videoId) => {
        setVideos(prev => prev.filter(v => v.id !== videoId));
      });
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
    };
  }, []);

  return (
    <div>
      <div>Videos: {videos.length}</div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div>Videos: {{ videos.length }}</div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, VideoPlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, videos: [] }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new VideoPlugin());
    
    this.editor.on('video:inserted', video => {
      this.videos.push(video);
    });
    
    this.editor.on('video:removed', videoId => {
      this.videos = this.videos.filter(v => v.id !== videoId);
    });
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.video-container {
  position: relative;
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.video-element {
  width: 100%;
  height: auto;
  display: block;
}

.video-caption {
  padding: 8px 12px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px 12px 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-container:hover .video-controls {
  opacity: 1;
}

.video-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  background: #f9fafb;
  transition: all 0.2s;
}

.video-upload-area:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.video-upload-area.dragover {
  border-color: #3b82f6;
  background: #dbeafe;
}
```

## Troubleshooting

1. **Video not uploading**
   - Check file size limits
   - Verify file format
   - Check upload URL
   - Ensure proper permissions

2. **Video not playing**
   - Check video format support
   - Verify video URL
   - Check browser compatibility
   - Ensure proper encoding

3. **Video display issues**
   - Check responsive CSS
   - Verify container sizing
   - Check for CSS conflicts
   - Ensure proper positioning

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
