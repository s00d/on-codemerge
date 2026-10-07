# Slim

On-Codemerge in the browser; Slim stores **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
composer require slim/slim slim/psr7
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
  editor.setHTML(html ?? '<p>Hello from Slim</p>');
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

Avoid top-level `await` unless you raise the Vite target. API body: `{ html }` (or `{ md }`).

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
