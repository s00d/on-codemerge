---
sidebar_position: 15
---

# Electron

Welcome to the Electron-specific documentation for **On-Codemerge**, an advanced web editor designed for seamless integration with Electron applications.

## Getting Started with Electron

To integrate On-Codemerge into your Electron application, install the package:

```bash
npm install --save on-codemerge
```

## Electron Integration Example

Here's how to integrate On-Codemerge into an Electron application:

1. **Create or Modify Your Electron HTML Page**:

```html title="index.html"
<!DOCTYPE html>
<html>
<head>
  <title>Your Electron App</title>
</head>
<body>
  <div id="editor"></div>
  <script src="path/to/your/javascript/file.js"></script>
</body>
</html>
```

2. **Initialize On-Codemerge in Your JavaScript File**:

```javascript title="path/to/your/javascript/file.js"
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', async () => {
  const editorElement = document.getElementById('editor');
  if (editorElement) {
    const editor = new HTMLEditor(editorElement);

    await editor.setLocale('ru');

    editor.use(new ToolbarPlugin());
    editor.use(new AlignmentPlugin());

    editor.subscribeToContentChange((newContent) => {
      console.log('Content changed:', newContent);
    });

    editor.setHtml('Initial content goes here');
    console.log(editor.getHtml());
  }
});
```

3. **Load the HTML Page in Electron**:

```javascript title="main.js"
const { app, BrowserWindow } = require('electron');

function createWindow () {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile('path/to/index.html');
}

app.on('ready', createWindow);
```
