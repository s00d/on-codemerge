# Electron

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Electron-specific documentation for **On-Codemerge**, an advanced web editor designed for seamless integration with Electron applications.

## Getting Started with Electron

To integrate On-Codemerge into your Electron application, install the package:

```bash
npm install on-codemerge
```

## Electron Integration Example

Here's how to integrate On-Codemerge into an Electron application:

1. **Create Your Electron HTML Page**:

```html title="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>On-Codemerge Electron App</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    #editor {
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 20px 0;
    }
    .controls {
      margin: 20px 0;
    }
    button {
      padding: 8px 16px;
      margin-right: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f8f9fa;
      cursor: pointer;
    }
    button:hover {
      background: #e9ecef;
    }
    #output {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>On-Codemerge with Electron</h1>
    <div class="controls">
      <button id="saveBtn">Save Content</button>
      <button id="loadBtn">Load Content</button>
      <button id="exportBtn">Export HTML</button>
    </div>
    <div id="editor"></div>
    <div id="output">
      <h3>Current HTML:</h3>
      <pre id="htmlOutput"></pre>
    </div>
  </div>
  <script type="module" src="./js/editor.js"></script>
</body>
</html>
```

2. **Initialize On-Codemerge**:

```javascript title="js/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '../node_modules/on-codemerge/index.js';
import '../node_modules/on-codemerge/public.css';
import '../node_modules/on-codemerge/index.css';
import '../node_modules/on-codemerge/plugins/ToolbarPlugin/style.css';
import '../node_modules/on-codemerge/plugins/AlignmentPlugin/public.css';
import '../node_modules/on-codemerge/plugins/AlignmentPlugin/style.css';

class ElectronEditor {
  constructor() {
    this.editor = null;
    this.init();
  }


_…trimmed for the v1 archive. See source history for the full guide._
