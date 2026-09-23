# Quarkus

On-Codemerge in the browser; Quarkus stores **HTML** (or Markdown).

Cloud-native Java.

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
  editor.setHTML(html ?? '<p>Hello from Quarkus</p>');
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

Serve static resources + JAX-RS `GET/PUT /api/doc` with `{ html }`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
