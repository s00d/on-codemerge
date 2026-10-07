# Wails

Go desktop + webview. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Editor (frontend)

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});
editor.setHTML('<p>Hello from Wails</p>');

editor.on('docChanged', () => {
  // window.go.main.App.SaveDoc(editor.getHTML())
});
```

Bind a Go method that stores the HTML/Markdown string.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [Go Gin](./go-gin.md)
- [Electron](./electron.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
