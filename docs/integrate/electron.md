# Electron

Vite-built renderer in a `BrowserWindow`. Load / save **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
npm install -D electron vite
```

## Renderer

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});
editor.setHTML(localStorage.getItem('ocm-html') ?? '<p>Hello from Electron</p>');
editor.on('docChanged', () => {
  localStorage.setItem('ocm-html', editor.getHTML());
  // or IPC: invoke('save-html', editor.getHTML())
});
```

Main: `loadFile('dist/index.html')` with Vite `base: './'`. Prefer preload/IPC over `nodeIntegration`.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
