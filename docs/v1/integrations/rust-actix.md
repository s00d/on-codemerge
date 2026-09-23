# Rust Actix-web

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Rust Actix-web-specific documentation for **On-Codemerge**, a versatile web editor designed for integration with Actix-web applications.

## Getting Started with Actix-web

To integrate On-Codemerge into your Actix-web application, add the required dependencies:

```bash
cargo new actix-on-codemerge
cd actix-on-codemerge
npm install on-codemerge
```

## Actix-web Integration Example

Here's how to integrate On-Codemerge into an Actix-web application:

1. **Create Rust Application**:

```rust title="src/main.rs"
use actix_web::{web, App, HttpResponse, HttpServer, Result};
use actix_files::Files;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, Clone)]
struct Content {
    id: u32,
    title: String,
    body: String,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize)]
struct SaveContentRequest {
    content: String,
    title: String,
}

#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    message: String,
    data: Option<T>,
}

struct AppState {
    contents: Mutex<HashMap<u32, Content>>,
    next_id: Mutex<u32>,
}

async fn index() -> Result<actix_files::NamedFile> {
    Ok(actix_files::NamedFile::open("static/index.html")?)
}

async fn save_content(
    state: web::Data<AppState>,
    request: web::Json<SaveContentRequest>,
) -> Result<HttpResponse> {
    let mut next_id = state.next_id.lock().unwrap();
    let mut contents = state.contents.lock().unwrap();
    
    let content = Content {
        id: *next_id,
        title: request.title.clone(),
        body: request.content.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    contents.insert(*next_id, content.clone());
    *next_id += 1;
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        message: "Content saved successfully!".to_string(),
        data: Some(content),
    }))
}

async fn get_content(
    state: web::Data<AppState>,
    path: web::Path<u32>,
) -> Result<HttpResponse> {
    let contents = state.contents.lock().unwrap();
    
    if let Some(content) = contents.get(&path.into_inner()) {
        Ok(HttpResponse::Ok().json(ApiResponse {
            success: true,
            message: "Content retrieved successfully!".to_string(),
            data: Some(content.clone()),
        }))
    } else {

_…trimmed for the v1 archive. See source history for the full guide._
