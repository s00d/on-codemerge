# Rust Poem

On-Codemerge in the browser; Poem stores **HTML** (or Markdown).

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
editor.setHTML(html ?? '<p>Hello from Poem</p>');

editor.on('docChanged', () => {
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html: editor.getHTML() }),
  });
});
```

Static files for the SPA; `{ html }` on `/api/doc`.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Tiny API shape (server is secondary)

```rust
use poem::{get, handler, put, web::Json, Route};
use poem::endpoint::StaticFilesEndpoint;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct DocBody {
    html: String,
}

#[handler]
async fn get_doc() -> Json<DocBody> {
    Json(DocBody { html: "<p>…</p>".into() })
}

#[handler]
async fn put_doc(Json(body): Json<DocBody>) -> Json<DocBody> {
    // persist body.html
    Json(body)
}

let app = Route::new()
    .at("/api/doc", get(get_doc).put(put_doc))
    .nest("/", StaticFilesEndpoint::new("dist").index_file("index.html"));
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
