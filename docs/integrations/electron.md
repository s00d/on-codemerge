---
sidebar_position: 15
---

# Electron

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

  async init() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) return;

    // Initialize editor
    this.editor = new HTMLEditor(editorElement);

    // Set locale
    await this.editor.setLocale('ru');

    // Register plugins
    this.editor.use(new ToolbarPlugin());
    this.editor.use(new AlignmentPlugin());

    // Subscribe to content changes
    this.editor.subscribeToContentChange((newContent) => {
      this.updateOutput(newContent);
    });

    // Set initial content
    this.editor.setHtml('<p>Welcome to On-Codemerge with Electron!</p>');

    // Setup controls
    this.setupControls();
  }

  updateOutput(content) {
    const output = document.getElementById('htmlOutput');
    if (output) {
      output.textContent = content;
    }
  }

  setupControls() {
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const content = this.editor.getHtml();
        // Use Electron's dialog to save file
        if (window.electronAPI) {
          window.electronAPI.saveFile(content);
        } else {
          console.log('Content to save:', content);
        }
      });
    }

    // Load button
    const loadBtn = document.getElementById('loadBtn');
    if (loadBtn) {
      loadBtn.addEventListener('click', async () => {
        if (window.electronAPI) {
          const content = await window.electronAPI.loadFile();
          if (content) {
            this.editor.setHtml(content);
          }
        }
      });
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const content = this.editor.getHtml();
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Exported Content</title>
</head>
<body>
  ${content}
</body>
</html>`;
        
        if (window.electronAPI) {
          window.electronAPI.exportFile(fullHtml);
        } else {
          console.log('Export content:', fullHtml);
        }
      });
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ElectronEditor();
});
```

3. **Electron Main Process**:

```javascript title="main.js"
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('save-file', async (event, content) => {
  const result = await dialog.showSaveDialog({
    filters: [{ name: 'HTML Files', extensions: ['html'] }]
  });
  
  if (!result.canceled) {
    fs.writeFileSync(result.filePath, content);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('load-file', async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: 'HTML Files', extensions: ['html'] }]
  });
  
  if (!result.canceled) {
    return fs.readFileSync(result.filePaths[0], 'utf8');
  }
  return null;
});

ipcMain.handle('export-file', async (event, content) => {
  const result = await dialog.showSaveDialog({
    filters: [{ name: 'HTML Files', extensions: ['html'] }]
  });
  
  if (!result.canceled) {
    fs.writeFileSync(result.filePath, content);
    return { success: true };
  }
  return { success: false };
});
```

4. **Preload Script**:

```javascript title="preload.js"
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content) => ipcRenderer.invoke('save-file', content),
  loadFile: () => ipcRenderer.invoke('load-file'),
  exportFile: (content) => ipcRenderer.invoke('export-file', content)
});
```

5. **Package.json Configuration**:

```json title="package.json"
{
  "name": "on-codemerge-electron",
  "version": "1.0.0",
  "description": "On-Codemerge Electron App",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dev": "NODE_ENV=development electron .",
    "build": "electron-builder"
  },
  "dependencies": {
    "on-codemerge": "^1.0.0"
  },
  "devDependencies": {
    "electron": "^25.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

## Key Features

- **Desktop Integration**: Full desktop application capabilities
- **File Operations**: Save, load, and export content to files
- **Native Dialogs**: Use system file dialogs
- **Security**: Proper context isolation and security practices
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support
