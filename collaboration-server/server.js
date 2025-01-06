const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });
const documents = new Map(); // Хранение документов по их ID


wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const { type, docId, content, userId } = data;

    if (type === 'join') {
      // Подключение к документу
      if (!documents.has(docId)) {
        documents.set(docId, { content: content ?? '', clients: new Set() });
      }
      documents.get(docId).clients.add(ws);
      ws.docId = docId;
      ws.send(JSON.stringify({ type: 'init', content: documents.get(docId).content, userId: userId }));
    } else if (type === 'update') {
      // Обновление документа
      if (documents.has(docId)) {
        documents.get(docId).content = content;
        documents.get(docId).clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'update', content, userId: userId }));
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

console.log('WebSocket server is running on ws://localhost:8080');
