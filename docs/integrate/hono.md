# Hono

Use On-Codemerge in the browser; Hono only stores the HTML (or Markdown) string you extract.

Works on Node, Bun, Deno, and Cloudflare Workers.

## Install

```bash
npm install on-codemerge hono @hono/node-server
```

## Editor (what matters)

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});

const { html } = await fetch('/api/doc').then((r) => r.json());
editor.setHTML(html ?? '<p>Hello from Hono</p>');

editor.on('docChanged', () => {
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html: editor.getHTML() }),
  });
});
```

## Tiny API shape (server is secondary)

```ts
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

const app = new Hono();
let html = '<p>Hello from Hono</p>';

app.get('/api/doc', (c) => c.json({ html }));
app.put('/api/doc', async (c) => {
  const body = await c.req.json<{ html: string }>();
  html = body.html;
  return c.json({ html });
});
app.use('/*', serveStatic({ root: './dist' }));
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
