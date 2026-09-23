# Rust Axum

On-Codemerge in the browser; Axum stores **HTML** (or Markdown).

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
editor.setHTML(html ?? '<p>Hello from Axum</p>');

editor.on('docChanged', () => {
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html: editor.getHTML() }),
  });
});
```

Bundle with Vite; serve `dist` from Axum. Focus on `setHTML` / `getHTML`.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Tiny API shape (server is secondary)

```rust
use axum::{routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use tower_http::services::ServeDir;

#[derive(Serialize, Deserialize)]
struct DocBody {
    html: String,
}

async fn get_doc() -> Json<DocBody> {
    Json(DocBody { html: "<p>…</p>".into() }) // load from store
}

async fn put_doc(Json(body): Json<DocBody>) -> Json<DocBody> {
    // persist body.html
    Json(body)
}

let app = Router::new()
    .route("/api/doc", get(get_doc).put(put_doc))
    .fallback_service(ServeDir::new("dist"));
```

Same idea for `"md"` if you store Markdown.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
