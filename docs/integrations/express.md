---
sidebar_position: 16
---

# Express

Welcome to the Express.js-specific documentation for **On-Codemerge**, a sophisticated web editor designed for easy integration with Express.js applications.

## Getting Started with Express.js

To integrate On-Codemerge into your Express.js application, install the package:

```bash
npm install --save on-codemerge
```

## Express.js Integration Example

Here's how to integrate On-Codemerge into an Express.js application:

1. **Set Up Your Express.js Server**:

```javascript title="app.js"
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

2. **Create Your HTML File**:

```html title="public/index.html"
<!DOCTYPE html>
<html>
<head>
  <title>Your Express App</title>
</head>
<body>
  <div id="editor"></div>
  <script src="path/to/your/javascript/file.js"></script>
</body>
</html>
```

3. **Initialize On-Codemerge in a JavaScript File**:

```javascript title="public/path/to/your/javascript/file.js"
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
