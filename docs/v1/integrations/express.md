# Express

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Express.js-specific documentation for **On-Codemerge**, a sophisticated web editor designed for easy integration with Express.js applications.

## Getting Started with Express.js

To integrate On-Codemerge into your Express.js application, install the package:

```bash
npm install on-codemerge
```

## Express.js Integration Example

Here's how to integrate On-Codemerge into an Express.js application:

1. **Set Up Your Express.js Server**:

```javascript title="app.js"
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to save content
app.post('/api/save', (req, res) => {
  const { content } = req.body;
  console.log('Saving content:', content);
  // Add your save logic here
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

2. **Create Your HTML File**:

```html title="public/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>On-Codemerge Express App</title>
  <link rel="stylesheet" href="/node_modules/on-codemerge/public.css">
  <link rel="stylesheet" href="/node_modules/on-codemerge/index.css">
  <link rel="stylesheet" href="/node_modules/on-codemerge/plugins/ToolbarPlugin/style.css">
  <link rel="stylesheet" href="/node_modules/on-codemerge/plugins/AlignmentPlugin/public.css">
  <link rel="stylesheet" href="/node_modules/on-codemerge/plugins/AlignmentPlugin/style.css">
</head>
<body>
  <div class="container">
    <h1>On-Codemerge with Express</h1>
    <div id="editor"></div>
    <button id="saveBtn">Save Content</button>
    <div id="output">
      <h3>Current HTML:</h3>
      <pre id="htmlOutput"></pre>
    </div>
  </div>
  <script type="module" src="/js/editor.js"></script>
</body>
</html>
```

3. **Initialize On-Codemerge**:

```javascript title="public/js/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '/node_modules/on-codemerge/index.js';

class EditorManager {
  constructor() {
    this.editor = null;
    this.init();
  }

  async init() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) return;

    // Initialize editor
    this.editor = new HTMLEditor(editorElement);

    // Set locale
    await this.editor.setLocale('ru');


_…trimmed for the v1 archive. See source history for the full guide._
