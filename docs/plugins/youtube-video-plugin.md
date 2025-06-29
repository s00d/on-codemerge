# YouTube Video Plugin

The YouTube Video Plugin provides seamless YouTube video embedding capabilities for the on-CodeMerge editor, allowing users to insert and manage YouTube videos with interactive features.

## Features

- **YouTube Video Embedding**: Insert YouTube videos by URL or video ID
- **Interactive Resizing**: Resize embedded videos with handles
- **Context Menu**: Right-click for quick video operations
- **URL Parsing**: Automatic extraction of video ID from various YouTube URL formats
- **Responsive Design**: Automatic responsive behavior
- **Fullscreen Support**: Enable fullscreen video playback
- **Toolbar Integration**: Easy access via toolbar button
- **Multiple URL Formats**: Support for various YouTube URL formats

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, YouTubeVideoPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new YouTubeVideoPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['YouTubeVideoPlugin']" />

## API Reference

### YouTube Video Creation

```javascript
// Insert YouTube video programmatically
editor.executeCommand('youtube-video');

// Create YouTube video with specific URL
const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
editor.executeCommand('insertYouTubeVideo', { url: videoUrl });
```

### YouTube Video Operations

```javascript
// Get all YouTube videos in editor
const videos = editor.getContainer().querySelectorAll('iframe[src*="youtube.com"]');

// Set video properties
const video = document.querySelector('iframe[src*="youtube.com"]');
video.width = '600';
video.height = '400';
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+Y` | Insert YouTube video | `youtube-video` |

## Supported YouTube URL Formats

The plugin supports various YouTube URL formats:

### Standard URLs
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

### Short URLs
- `https://youtu.be/VIDEO_ID`
- `https://y2u.be/VIDEO_ID`

### Mobile URLs
- `https://m.youtube.com/watch?v=VIDEO_ID`

### Playlist URLs
- `https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID`

### Live Stream URLs
- `https://www.youtube.com/watch?v=VIDEO_ID&live=1`

## Context Menu

Right-click on a YouTube video to access:

### Video Operations
- **Edit Video**: Open video editor
- **Copy Video URL**: Copy YouTube URL to clipboard
- **Delete Video**: Remove video from editor

### Display Options
- **Video Size**: Adjust video dimensions
- **Video Alignment**: Left, center, or right alignment
- **Video Border**: Add or remove borders

## YouTube Video Structure

### HTML Structure
```html
<iframe 
  src="https://www.youtube.com/embed/VIDEO_ID" 
  width="800" 
  height="400" 
  frameborder="0" 
  allowfullscreen 
  class="max-w-full rounded-lg p-2">
</iframe>
```

### CSS Classes
- `.max-w-full` - Maximum width 100%
- `.rounded-lg` - Rounded corners
- `.p-2` - Padding

## Events

```javascript
// Listen to YouTube video events
editor.on('youtube-video:inserted', (video) => {
  console.log('YouTube video inserted:', video);
});

editor.on('youtube-video:edited', (video) => {
  console.log('YouTube video edited:', video);
});

editor.on('youtube-video:deleted', (video) => {
  console.log('YouTube video deleted:', video);
});

editor.on('youtube-video:resized', (video, dimensions) => {
  console.log('YouTube video resized:', video, dimensions);
});
```

## Examples

### Basic YouTube Video

```html
<iframe 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
  width="800" 
  height="400" 
  frameborder="0" 
  allowfullscreen 
  class="max-w-full rounded-lg p-2">
</iframe>
```

### Responsive YouTube Video

```html
<iframe 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
  width="100%" 
  height="400" 
  frameborder="0" 
  allowfullscreen 
  class="max-w-full rounded-lg p-2"
  style="max-width: 100%; height: auto;">
</iframe>
```

### YouTube Video with Custom Styling

```html
<iframe 
  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
  width="600" 
  height="300" 
  frameborder="0" 
  allowfullscreen 
  class="max-w-full rounded-lg p-2"
  style="border: 2px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
</iframe>
```

## Video ID Extraction

The plugin automatically extracts video IDs from various URL formats:

```javascript
// Supported URL patterns
const urlPatterns = [
  'https://www.youtube.com/watch?v=VIDEO_ID',
  'https://youtu.be/VIDEO_ID',
  'https://www.youtube.com/embed/VIDEO_ID',
  'https://m.youtube.com/watch?v=VIDEO_ID',
  'https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID'
];

// Video ID extraction regex
const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, YouTubeVideoPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new YouTubeVideoPlugin());
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
import { HTMLEditor, YouTubeVideoPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new YouTubeVideoPlugin());
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
/* YouTube video styles */
.html-editor iframe[src*="youtube.com"] {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.html-editor iframe[src*="youtube.com"]:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Responsive video container */
.youtube-video-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}

.youtube-video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### Custom Themes

```css
/* Dark theme */
.youtube-video.dark-theme {
  border-color: #374151;
  background-color: #1f2937;
}

/* Light theme */
.youtube-video.light-theme {
  border-color: #e5e7eb;
  background-color: #ffffff;
}

/* Custom video sizes */
.youtube-video.small {
  width: 400px;
  height: 225px;
}

.youtube-video.medium {
  width: 600px;
  height: 338px;
}

.youtube-video.large {
  width: 800px;
  height: 450px;
}
```

## YouTube API Integration

For advanced features, you can integrate with the YouTube Data API:

```javascript
// Get video information
async function getVideoInfo(videoId) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=YOUR_API_KEY&part=snippet,statistics`
  );
  const data = await response.json();
  return data.items[0];
}

// Example usage
const videoInfo = await getVideoInfo('dQw4w9WgXcQ');
console.log('Video title:', videoInfo.snippet.title);
console.log('View count:', videoInfo.statistics.viewCount);
```

## Troubleshooting

### Common Issues

1. **Video not embedding**
   - Check if URL is valid YouTube URL
   - Verify video ID extraction is working
   - Check browser console for errors

2. **Video not resizing**
   - Make sure video is clicked to activate
   - Check for conflicting CSS styles
   - Verify ResizableElement is properly initialized

3. **Context menu not working**
   - Ensure iframe has proper event handlers
   - Check for event handler conflicts
   - Verify ContextMenu component is initialized

4. **Video not responsive**
   - Check if responsive CSS is applied
   - Verify iframe has proper classes
   - Ensure container has responsive styles

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('YouTube Video plugin initialized');

// Check video events
editor.on('youtube-video:inserted', (video) => {
  console.log('YouTube video inserted:', video);
});

// Check URL parsing
const videoId = extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
console.log('Extracted video ID:', videoId);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Videos are loaded on-demand
- Responsive design prevents layout shifts
- Lazy loading can be implemented for multiple videos
- Video thumbnails can improve loading performance

## Privacy and Security

- YouTube videos respect user privacy settings
- No personal data is transmitted to YouTube
- Videos are embedded using YouTube's official embed code
- HTTPS is enforced for secure connections

## Accessibility

- Screen reader support for video descriptions
- Keyboard navigation for video controls
- High contrast themes available
- Proper ARIA labels for video elements

## License

MIT License - see LICENSE file for details. 
