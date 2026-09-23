# Blazor

On-Codemerge in the browser; Blazor stores **HTML** (or Markdown).

Host the editor in an iframe or JS interop island — Blazor does not replace the browser editor.

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
  editor.setHTML(html ?? '<p>Hello from Blazor</p>');
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

Use `IJSRuntime` to call `setHTML` / `getHTML`, or embed a static SPA page that talks to your ASP.NET API.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
