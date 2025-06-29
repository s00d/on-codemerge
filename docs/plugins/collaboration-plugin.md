# Collaboration Plugin

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

<EditorComponent :activePlugins="['CollaborationPlugin']" />

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

editor.on('collaboration:user-joined', (userId) => {
  console.log('User joined:', userId);
});

editor.on('collaboration:user-left', (userId) => {
  console.log('User left:', userId);
});

editor.on('collaboration:content-updated', (content) => {
  console.log('Content updated from another user');
});

editor.on('collaboration:error', (error) => {
  console.error('Collaboration error:', error);
});
```

## Collaboration Server

The Collaboration Plugin requires a WebSocket server to handle real-time communication between users. We provide a ready-to-use server implementation.

### Official Collaboration Server

The official collaboration server is available at: [https://github.com/s00d/on-codemerge/tree/main/collaboration-server](https://github.com/s00d/on-codemerge/tree/main/collaboration-server)

#### Features

- **Real-time WebSocket Communication**: Fast, bidirectional messaging
- **Document Management**: Automatic document creation and cleanup
- **User Tracking**: Track connected users per document
- **Content Synchronization**: Real-time content updates
- **Automatic Cleanup**: Remove documents when all users disconnect
- **Simple Setup**: Easy to deploy and configure

#### Quick Start

1. Clone the repository and navigate to the collaboration-server:
```bash
cd collaboration-server
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Start the server:
```bash
npm start
```

The server will start on `ws://localhost:8080`.

#### Production Deployment

For production deployment, you can use:

```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name collaboration-server

# Using Docker
docker build -t collaboration-server .
docker run -p 8080:8080 collaboration-server

# Using Railway
# Connect your repository and deploy automatically
```

### Server Architecture

The collaboration server maintains a Map of documents, where each document contains:
- `content`: Current document content
- `clients`: Set of connected WebSocket clients

#### Message Protocol

**Join Document:**
```javascript
{
  type: 'join',
  docId: 'document-id',
  content: 'initial-content',
  userId: 'user-id'
}
```

**Update Document:**
```javascript
{
  type: 'update',
  docId: 'document-id',
  content: 'updated-content',
  userId: 'user-id'
}
```

**Server Responses:**
```javascript
// Initialization
{
  type: 'init',
  content: 'document-content',
  userId: 'user-id'
}

// Content Update
{
  type: 'update',
  content: 'updated-content',
  userId: 'user-id'
}
```

### Custom Server Implementation

You can implement your own WebSocket server following this protocol:

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const documents = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const { type, docId, content, userId } = data;

    if (type === 'join') {
      // Join document
      if (!documents.has(docId)) {
        documents.set(docId, { content: content ?? '', clients: new Set() });
      }
      documents.get(docId).clients.add(ws);
      ws.docId = docId;
      ws.send(JSON.stringify({ 
        type: 'init', 
        content: documents.get(docId).content, 
        userId: userId 
      }));
    } else if (type === 'update') {
      // Update document
      if (documents.has(docId)) {
        documents.get(docId).content = content;
        documents.get(docId).clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: 'update', 
              content, 
              userId: userId 
            }));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    if (ws.docId && documents.has(ws.docId)) {
      documents.get(ws.docId).clients.delete(ws);
      if (documents.get(ws.docId).clients.size === 0) {
        documents.delete(ws.docId);
      }
    }
  });
});
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, CollaborationPlugin } from 'on-codemerge';

function CollaborativeEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectedUsers, setConnectedUsers] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new CollaborationPlugin({
        serverUrl: 'ws://localhost:8080',
        autoStart: true
      }));

      // Listen to collaboration events
      editorInstance.current.on('collaboration:connected', () => {
        setConnectionStatus('connected');
      });

      editorInstance.current.on('collaboration:disconnected', () => {
        setConnectionStatus('disconnected');
      });

      editorInstance.current.on('collaboration:user-joined', (userId) => {
        setConnectedUsers(prev => [...prev, userId]);
      });

      editorInstance.current.on('collaboration:user-left', (userId) => {
        setConnectedUsers(prev => prev.filter(id => id !== userId));
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
      <div className="collaboration-status">
        <span>Status: {connectionStatus}</span>
        <span>Users: {connectedUsers.length}</span>
      </div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div class="collaboration-status">
      <span>Status: {{ connectionStatus }}</span>
      <span>Users: {{ connectedUsers.length }}</span>
    </div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import { HTMLEditor, CollaborationPlugin } from 'on-codemerge';

export default {
  data() {
    return {
      editor: null,
      connectionStatus: 'disconnected',
      connectedUsers: []
    };
  },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new CollaborationPlugin({
      serverUrl: 'ws://localhost:8080',
      autoStart: true
    }));

    // Listen to collaboration events
    this.editor.on('collaboration:connected', () => {
      this.connectionStatus = 'connected';
    });

    this.editor.on('collaboration:disconnected', () => {
      this.connectionStatus = 'disconnected';
    });

    this.editor.on('collaboration:user-joined', (userId) => {
      this.connectedUsers.push(userId);
    });

    this.editor.on('collaboration:user-left', (userId) => {
      this.connectedUsers = this.connectedUsers.filter(id => id !== userId);
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

## Advanced Configuration

### Custom Server URL

```javascript
// Use production server
editor.use(new CollaborationPlugin({
  serverUrl: 'wss://your-production-server.com',
  autoStart: true
}));

// Use local development server
editor.use(new CollaborationPlugin({
  serverUrl: 'ws://localhost:8080',
  autoStart: true
}));
```

### Manual Control

```javascript
const collaborationPlugin = new CollaborationPlugin({
  serverUrl: 'ws://localhost:8080',
  autoStart: false // Don't start automatically
});

editor.use(collaborationPlugin);

// Start collaboration manually
collaborationPlugin.startCollaboration();

// Stop collaboration
collaborationPlugin.disconnect();
```

### Error Handling

```javascript
editor.on('collaboration:error', (error) => {
  console.error('Collaboration error:', error);
  
  // Attempt to reconnect
  setTimeout(() => {
    collaborationPlugin.reconnect();
  }, 5000);
});
```

## Styling

```css
.collaboration-status {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.collaboration-status.connected {
  background: #dcfce7;
  color: #166534;
}

.collaboration-status.disconnected {
  background: #fef2f2;
  color: #dc2626;
}

.collaboration-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.collaboration-indicator.connected {
  background: #22c55e;
}

.collaboration-indicator.disconnected {
  background: #ef4444;
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the collaboration server is running
   - Check the server URL is correct
   - Verify the port is not blocked by firewall

2. **Content Not Syncing**
   - Check WebSocket connection status
   - Verify document ID is consistent across clients
   - Ensure server is handling messages correctly

3. **Users Not Appearing**
   - Check user ID generation
   - Verify join/leave events are being sent
   - Check server user tracking logic

### Debug Mode

Enable debug logging for troubleshooting:

```javascript
// Enable WebSocket debugging
localStorage.setItem('debug', 'ws');

// Enable collaboration plugin debugging
localStorage.setItem('debug', 'collaboration');
```

## Performance Considerations

- **Connection Limits**: Monitor server connection limits
- **Message Size**: Keep update messages small
- **Reconnection**: Implement exponential backoff for reconnections
- **Memory Usage**: Monitor document memory usage on server

## Security

- **Authentication**: Implement user authentication if needed
- **Authorization**: Control document access permissions
- **Input Validation**: Validate all incoming messages
- **Rate Limiting**: Implement rate limiting to prevent abuse

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
