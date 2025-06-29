# Collaboration Server

A WebSocket server for real-time collaborative editing with the On-CodeMerge editor. This server enables multiple users to work on the same document simultaneously with automatic content synchronization.

## Features

- **Real-time Collaboration**: Multiple users can edit documents simultaneously
- **WebSocket Communication**: Fast, bidirectional communication
- **Document Management**: Automatic document creation and cleanup
- **User Tracking**: Track connected users per document
- **Content Synchronization**: Real-time content updates across all connected clients
- **Automatic Cleanup**: Remove documents when all users disconnect
- **Simple Setup**: Easy to deploy and configure

## Installation

1. Clone the repository and navigate to the collaboration-server directory:
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
# or
pnpm start
```

The server will start on `ws://localhost:8080`.

## Usage

### Starting the Server

```bash
# Development
npm start

# Production (with PM2)
pm2 start server.js --name collaboration-server

# With custom port
PORT=3000 node server.js
```

### Environment Variables

- `PORT`: Server port (default: 8080)

### WebSocket Events

The server handles the following WebSocket events:

#### Join Document
```javascript
{
  type: 'join',
  docId: 'document-id',
  content: 'initial-content',
  userId: 'user-id'
}
```

#### Update Document
```javascript
{
  type: 'update',
  docId: 'document-id',
  content: 'updated-content',
  userId: 'user-id'
}
```

### Server Responses

#### Initialization
```javascript
{
  type: 'init',
  content: 'document-content',
  userId: 'user-id'
}
```

#### Content Update
```javascript
{
  type: 'update',
  content: 'updated-content',
  userId: 'user-id'
}
```

## API Reference

### WebSocket Connection

Connect to the server using WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Connected to collaboration server');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onclose = () => {
  console.log('Disconnected from collaboration server');
};
```

### Client Integration

Example of how to integrate with the On-CodeMerge editor:

```javascript
import { HTMLEditor, CollaborationPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CollaborationPlugin({
  serverUrl: 'ws://localhost:8080',
  autoStart: true
}));
```

## Architecture

### Document Management

The server maintains a Map of documents, where each document contains:
- `content`: Current document content
- `clients`: Set of connected WebSocket clients

### Client Tracking

Each WebSocket connection is associated with:
- `docId`: Document ID the client is editing
- `userId`: Unique user identifier

### Message Flow

1. **Join**: Client sends join message with document ID and initial content
2. **Update**: Client sends update message with new content
3. **Broadcast**: Server broadcasts updates to all other clients in the same document
4. **Cleanup**: Server removes documents when all clients disconnect

## Deployment

### Local Development

```bash
npm install
npm start
```

### Production Deployment

#### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name collaboration-server
pm2 save
pm2 startup
```

#### Using Docker

Create a Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t collaboration-server .
docker run -p 8080:8080 collaboration-server
```

#### Using Railway

1. Connect your repository to Railway
2. Set the start command to `node server.js`
3. Deploy automatically

## Configuration

### Custom Port

Set the port using environment variables:

```bash
PORT=3000 node server.js
```

### SSL/TLS Support

For production, use a reverse proxy like Nginx:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Monitoring

### Health Check

Add a health check endpoint:

```javascript
const http = require('http');

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      documents: documents.size,
      connections: wss.clients.size
    }));
  }
});

healthServer.listen(8081);
```

### Logging

Add logging for better monitoring:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Add to your server code
logger.info('WebSocket server started', { port: 8080 });
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the server is running and the port is correct
2. **Messages Not Received**: Check WebSocket connection status
3. **Content Not Syncing**: Verify document ID is consistent across clients

### Debug Mode

Enable debug logging:

```javascript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Debug mode enabled');
  // Add debug logging
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the [On-CodeMerge documentation](https://github.com/s00d/on-codemerge)
- Review the [Collaboration Plugin documentation](../docs/plugins/collaboration-plugin.md) 