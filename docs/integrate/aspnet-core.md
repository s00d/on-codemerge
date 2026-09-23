# ASP.NET Core

On-Codemerge in the browser; ASP.NET Core stores **HTML** (or Markdown).

Top backend framework by Stack Overflow usage alongside Node.

## Install

```bash
npm install on-codemerge
```

## Editor

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

async function main() {
  const editor = new Editor(document.getElementById('editor'), {
    plugins: createCorePlugins(),
  });
  const { html } = await fetch('/api/doc').then((r) => r.json());
  editor.setHTML(html ?? '<p>Hello from ASP.NET Core</p>');
  editor.on('docChanged', () => {
    fetch('/api/doc', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ html: editor.getHTML() }),
    });
  });
}
main();
```

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

Serve `wwwroot` (Vite build) and a minimal API: `MapGet/MapPut("/api/doc", …)` with `{ html }`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
