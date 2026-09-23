# Collaboration Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Collaboration Plugin enables real-time collaborative editing for the on-CodeMerge editor, allowing multiple users to work on the same document simultaneously with WebSocket-based synchronization.

## Features

- **Real-time Collaboration**: Multiple users can edit simultaneously
- **WebSocket Communication**: Fast, bidirectional communication
- **Content Synchronization**: Automatic content updates across users
- **Version Control**: Prevents conflicts with version tracking
- **Auto-reconnection**: Automatic reconnection on connection loss
- **User Management**: Unique user identification and tracking
- **Document Sharing**: Share documents via URL parameters
- **Conflict Resolution**: Smart conflict detection and resolution
- **Status Indicators**: Visual connection status feedback
- **Document Cleanup**: Automatic cleanup when all users disconnect

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, CollaborationPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CollaborationPlugin({
  serverUrl: 'ws://localhost:8080',
  autoStart: true
}));
```

## Demo

## API Reference

### Plugin Configuration

```javascript
interface CollaborationPluginOptions {
  serverUrl?: string;    // WebSocket server URL
  autoStart?: boolean;   // Auto-start collaboration
}

const collaborationPlugin = new CollaborationPlugin({
  serverUrl: 'ws://localhost:8080',
  autoStart: true
});
```

### Collaboration Methods

```javascript
// Start collaboration manually
collaborationPlugin.startCollaboration();

// Get connection status
const status = collaborationPlugin.getConnectionStatus();

// Get current user ID
const userId = collaborationPlugin.getUserId();

// Get document ID
const docId = collaborationPlugin.getDocumentId();

// Disconnect from collaboration
collaborationPlugin.disconnect();

// Reconnect to collaboration
collaborationPlugin.reconnect();
```

### WebSocket Events

```javascript
// Listen to collaboration events
editor.on('collaboration:connected', () => {
  console.log('Connected to collaboration server');
});

editor.on('collaboration:disconnected', () => {
  console.log('Disconnected from collaboration server');
});


_…trimmed for the v1 archive. See source history for the full guide._
