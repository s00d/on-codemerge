# Rust Actix-web

Serve a Vite-built editor and persist document **JSON** with Actix-web.

Verified with Actix-web 4 + `actix-files` + Vite + `on-codemerge@2.0.3` (browser smoke).

## Install

```toml
# Cargo.toml
actix-web = "4"
actix-files = "0.6"
serde_json = "1"
```

```bash
npm install on-codemerge
npm install -D vite
```

## Minimal example

Build editor into `public/dist`, then:

```rust
use actix_files::{Files, NamedFile};
use actix_web::{get, put, web, App, HttpServer, Responder, Result};
use serde_json::{json, Value};
use std::fs;

#[get("/api/doc")]
async fn get_doc() -> impl Responder {
    let body = fs::read_to_string("data/doc.json").unwrap();
    web::Json(serde_json::from_str::<Value>(&body).unwrap())
}

#[put("/api/doc")]
async fn put_doc(body: web::Json<Value>) -> impl Responder {
    let out = json!({ "doc": body.get("doc") });
    fs::write("data/doc.json", serde_json::to_string_pretty(&out).unwrap()).unwrap();
    web::Json(json!({ "ok": true }))
}

#[get("/")]
async fn index() -> Result<NamedFile> {
    Ok(NamedFile::open("public/index.html")?)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(index)
            .service(get_doc)
            .service(put_doc)
            .service(Files::new("/dist", "public/dist"))
    })
    .bind(("127.0.0.1", 3000))?
    .run()
    .await
}
```

## Persist

`PUT /api/doc` with `{ "doc": editor.getJSON() }`.

## Gotchas

- Serve built Vite assets; do not try to import the npm package from Rust.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
