# Rust Rocket

On-Codemerge in the browser; Rocket stores **HTML** (or Markdown).

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
editor.setHTML(html ?? '<p>Hello from Rocket</p>');

editor.on('docChanged', () => {
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html: editor.getHTML() }),
  });
});
```

Vite `dist` + `FileServer`; persist the HTML string Rocket receives.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Tiny API shape (server is secondary)

```rust
use rocket::fs::FileServer;
use rocket::serde::{json::Json, Deserialize, Serialize};
use rocket::{get, put, routes};

#[derive(Serialize, Deserialize)]
struct DocBody {
    html: String,
}

#[get("/api/doc")]
fn get_doc() -> Json<DocBody> {
    Json(DocBody { html: "<p>…</p>".into() })
}

#[put("/api/doc", data = "<body>")]
fn put_doc(body: Json<DocBody>) -> Json<DocBody> {
    // persist body.html
    body
}

rocket::build()
    .mount("/", routes![get_doc, put_doc])
    .mount("/", FileServer::from("dist"));
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
