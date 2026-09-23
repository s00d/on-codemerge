# Laravel

On-Codemerge via **Vite** (`laravel-vite-plugin`, not Mix). Load / save **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Editor (`resources/js/editor.js`)

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

async function main() {
  const editor = new Editor(document.getElementById('editor'), {
    plugins: createCorePlugins(),
  });
  const { html } = await fetch('/api/doc').then((r) => r.json());
  editor.setHTML(html ?? '<p>Hello from Laravel</p>');
  editor.on('docChanged', () => {
    fetch('/api/doc', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ html: editor.getHTML() }),
    });
  });
}
main();
```

Blade: `@vite(['resources/js/editor.js'])` + CSRF meta. Routes return/accept `{ html }`.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
