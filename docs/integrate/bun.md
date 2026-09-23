# Bun

On-Codemerge in the browser; Bun stores **HTML** (or Markdown).

Use Bun as runtime + HTTP server (or Bun.serve).

## Install

```bash
bun add on-codemerge
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
  editor.setHTML(html ?? '<p>Hello from Bun</p>');
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

`Bun.serve` can return HTML/static and JSON for `/api/doc`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
