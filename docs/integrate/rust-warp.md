# Rust Warp

On-Codemerge in the browser; Warp stores **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Editor

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});

const { html } = await fetch('/api/doc').then((r) => r.json());
editor.setHTML(html ?? '<p>Hello from Warp</p>');

editor.on('docChanged', () => {
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html: editor.getHTML() }),
  });
});
```

Serve Vite output with `warp::fs::dir`; JSON `{ html }` on `/api/doc`.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Tiny API shape (server is secondary)

```rust
use serde::{Deserialize, Serialize};
use warp::{Filter, Reply};

#[derive(Serialize, Deserialize)]
struct DocBody {
    html: String,
}

let doc = warp::path("api").and(warp::path("doc"));

let get_doc = doc
    .clone()
    .and(warp::get())
    .map(|| warp::reply::json(&DocBody { html: "<p>…</p>".into() }));

let put_doc = doc
    .and(warp::put())
    .and(warp::body::json())
    .map(|body: DocBody| {
        // persist body.html
        warp::reply::json(body)
    });

let routes = get_doc.or(put_doc).or(warp::fs::dir("dist"));
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
