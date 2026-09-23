# Express.js

Serve a Vite-built editor page and persist document **JSON** with a small API.

Verified with Express 5 + Vite + `on-codemerge@2.0.3` (build, `GET/PUT /api/doc`, browser smoke).

## Install

```bash
npm install express on-codemerge
npm install -D vite
```

## Minimal example

Client (`src/editor.js` — working smoke file):

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const INITIAL = {
  version: 1,
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello from Express' }] }],
  },
};

const host = document.getElementById('editor');
const editor = new Editor(host, { plugins: createCorePlugins() });

const loaded = await fetch('/api/doc').then((r) => r.json());
editor.setJSON(loaded.doc ?? INITIAL);

editor.on('docChanged', () => {
  const doc = editor.getJSON();
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ doc }),
  });
});
```

Build the client into `public/dist` (set Vite `publicDir: false` if you also serve from `public/`), then:

```js
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

const dataFile = path.resolve('data/doc.json');
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

app.get('/api/doc', (_req, res) => {
  res.json(JSON.parse(fs.readFileSync(dataFile, 'utf8')));
});

app.put('/api/doc', (req, res) => {
  fs.writeFileSync(dataFile, JSON.stringify({ doc: req.body.doc }, null, 2));
  res.json({ ok: true });
});

app.listen(3000);
```

`public/index.html` loads `/dist/editor.js` + `/dist/editor.css`.

## Persist

SoT is the JSON body `{ doc: editor.getJSON() }` on `PUT /api/doc`. HTML is only a boundary for export/paste.

## Gotchas

- Bundle the editor with Vite (or another bundler); do not expect a UMD global from the npm package alone.
- If Vite `outDir` is under `public/`, disable Vite’s `publicDir` copy to avoid nested-public warnings.
- Persist JSON, not `getHTML()`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
