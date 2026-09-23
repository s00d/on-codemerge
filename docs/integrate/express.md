# Express

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
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>On-Codemerge Express App</title>
    <link rel="stylesheet" href="/node_modules/on-codemerge/dist/public.css" />
    <link rel="stylesheet" href="/node_modules/on-codemerge/dist/index.css" />
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
import {
  Editor,
  createCorePlugins,
  AlignmentPlugin,
} from '/node_modules/on-codemerge/dist/app.mjs';

class EditorManager {
  constructor() {
    this.editor = null;
    this.init();
  }

  async init() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) return;

    // Initialize editor
    this.editor = new Editor(editorElement, {
      plugins: [...createCorePlugins(), AlignmentPlugin()],
    });

    // Subscribe to content changes
    this.editor.on('docChanged', (newContent) => {
      this.updateOutput(newContent);
    });

    // Set initial content
    this.editor.setHTML('<p>Welcome to On-Codemerge with Express!</p>');

    // Setup save button
    this.setupSaveButton();
  }

  updateOutput(content) {
    const output = document.getElementById('htmlOutput');
    if (output) {
      output.textContent = content;
    }
  }

  setupSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const content = this.editor.getHTML();
        try {
          const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
          });
          const result = await response.json();
          if (result.success) {
            alert('Content saved successfully!');
          }
        } catch (error) {
          console.error('Error saving content:', error);
          alert('Error saving content');
        }
      });
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new EditorManager();
});
```

## Key Features

- **Server Integration**: Easy integration with Express.js backend
- **API Endpoints**: Built-in support for saving content via API
- **Static File Serving**: Proper static file configuration
- **Content Management**: Real-time content updates and saving
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support
