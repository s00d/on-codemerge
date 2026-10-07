# Go Gin

Use On-Codemerge in the browser; Gin only stores the HTML (or Markdown) string you extract.

## Install

```bash
npm install on-codemerge
```

## Editor (what matters)

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});

// Load from your API (HTML is the usual path)
const { html } = await fetch('/api/doc').then((r) => r.json());
editor.setHTML(html ?? '<p>Hello from Gin</p>');

// Extract + save
editor.on('docChanged', () => {
  const html = editor.getHTML();
  // or: const md = editor.getMarkdown();
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html }),
  });
});
```

Bundle with Vite (or any bundler) and serve `index.html` + assets from Gin like any static SPA.

### Markdown

```js
editor.setMarkdown(md);
const md = editor.getMarkdown();
```

### Optional kernel

```js
const json = editor.getJSON(); // advanced / internal model
```

## Tiny API shape (server is secondary)

```go
// GET  /api/doc  →  { "html": "<p>…</p>" }
// PUT  /api/doc  ←  { "html": "<p>…</p>" }
```

Same idea for `"md"` if you store Markdown. Gin static file serving is ordinary — keep the focus on `setHTML` / `getHTML`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
