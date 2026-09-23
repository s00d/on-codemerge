# YouTube Video Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
