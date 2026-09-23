# Video Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
