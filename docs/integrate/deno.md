# Deno

On-Codemerge in the browser; Deno stores **HTML** (or Markdown).

Deno + npm specifier for the editor package.

## Install

```bash
deno add npm:on-codemerge
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
  editor.setHTML(html ?? '<p>Hello from Deno</p>');
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

Serve the built SPA with `Deno.serve`; store `{ html }` in memory/DB.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
