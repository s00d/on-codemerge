---
sidebar_position: 19
---

# Rust Actix-web

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
        Ok(HttpResponse::NotFound().json(ApiResponse::<Content> {
            success: false,
            message: "Content not found".to_string(),
            data: None,
        }))
    }
}

async fn list_contents(state: web::Data<AppState>) -> Result<HttpResponse> {
    let contents = state.contents.lock().unwrap();
    let contents_vec: Vec<Content> = contents.values().cloned().collect();
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        message: "Contents retrieved successfully!".to_string(),
        data: Some(contents_vec),
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        contents: Mutex::new(HashMap::new()),
        next_id: Mutex::new(1),
    });

    println!("Server running at http://localhost:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .service(Files::new("/static", "static").show_files_listing())
            .route("/", web::get().to(index))
            .service(
                web::scope("/api")
                    .route("/save-content", web::post().to(save_content))
                    .route("/get-content/{id}", web::get().to(get_content))
                    .route("/list-contents", web::get().to(list_contents)),
            )
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```

2. **Create HTML Template**:

```html title="static/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actix-web On-Codemerge Editor</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        #editor {
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 20px 0;
            min-height: 300px;
        }
        .controls {
            margin: 20px 0;
        }
        button {
            padding: 8px 16px;
            margin-right: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f8f9fa;
            cursor: pointer;
        }
        button:hover {
            background: #e9ecef;
        }
        .content-list {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Actix-web On-Codemerge Editor</h1>
        
        <div class="controls">
            <input type="text" id="content-title" placeholder="Content Title" value="Untitled">
            <button onclick="saveContent()">Save Content</button>
            <button onclick="loadContent()">Load Content</button>
            <button onclick="listContents()">List Contents</button>
        </div>
        
        <div id="editor"></div>
        
        <div class="content-list" id="content-list" style="display: none;">
            <h3>Saved Contents:</h3>
            <div id="contents-list"></div>
        </div>
    </div>

    <!-- Initial content -->
    <script id="initial-content" type="text/plain">Welcome to On-Codemerge with Actix-web!</script>

    <script type="module" src="/static/js/editor.js"></script>
    <script>
        function saveContent() {
            const content = window.editorInstance ? window.editorInstance.getHtml() : '';
            const title = document.getElementById('content-title').value || 'Untitled';
            
            fetch('/api/save-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content,
                    title: title
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Content saved successfully!');
                } else {
                    alert('Error saving content: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error saving content');
            });
        }

        function loadContent() {
            const contentId = prompt('Enter content ID:');
            if (contentId) {
                fetch(`/api/get-content/${contentId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.editorInstance.setHtml(data.data.body);
                        document.getElementById('content-title').value = data.data.title;
                    } else {
                        alert('Error loading content: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error loading content');
                });
            }
        }

        function listContents() {
            fetch('/api/list-contents')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const listDiv = document.getElementById('contents-list');
                    const contentList = document.getElementById('content-list');
                    
                    listDiv.innerHTML = '';
                    data.data.forEach(item => {
                        const itemDiv = document.createElement('div');
                        itemDiv.innerHTML = `
                            <strong>ID: ${item.id}</strong> - ${item.title}<br>
                            <small>Created: ${item.created_at}</small>
                            <button onclick="loadContentById(${item.id})">Load</button>
                            <hr>
                        `;
                        listDiv.appendChild(itemDiv);
                    });
                    
                    contentList.style.display = 'block';
                } else {
                    alert('Error loading contents: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error loading contents');
            });
        }

        function loadContentById(id) {
            fetch(`/api/get-content/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.editorInstance.setHtml(data.data.body);
                    document.getElementById('content-title').value = data.data.title;
                    document.getElementById('content-list').style.display = 'none';
                } else {
                    alert('Error loading content: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error loading content');
            });
        }
    </script>
</body>
</html>
```

3. **Create JavaScript for Editor**:

```javascript title="static/js/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '/node_modules/on-codemerge/index.js';
import '/node_modules/on-codemerge/public.css';
import '/node_modules/on-codemerge/index.css';
import '/node_modules/on-codemerge/plugins/ToolbarPlugin/style.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/public.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/style.css';

class ActixEditor {
  constructor() {
    this.editor = null;
    this.init();
  }

  async init() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) return;

    // Initialize editor
    this.editor = new HTMLEditor(editorElement);

    // Set locale
    await this.editor.setLocale('ru');

    // Register plugins
    this.editor.use(new ToolbarPlugin());
    this.editor.use(new AlignmentPlugin());

    // Subscribe to content changes
    this.editor.subscribeToContentChange((newContent) => {
      console.log('Content changed:', newContent);
    });

    // Set initial content
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Actix-web!';
    this.editor.setHtml(initialContent);

    // Make editor instance globally available
    window.editorInstance = this.editor;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ActixEditor();
});
```

4. **Cargo.toml Configuration**:

```toml title="Cargo.toml"
[package]
name = "actix-on-codemerge"
version = "0.1.0"
edition = "2021"

[dependencies]
actix-web = "4.4"
actix-files = "0.6"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
tokio = { version = "1.0", features = ["full"] }
```

5. **Project Structure**:

```
actix-on-codemerge/
├── Cargo.toml
├── package.json
├── src/
│   └── main.rs
└── static/
    ├── index.html
    └── js/
        └── editor.js
```

6. **Package.json**:

```json title="package.json"
{
  "name": "actix-on-codemerge",
  "version": "1.0.0",
  "description": "Actix-web app with On-Codemerge editor",
  "dependencies": {
    "on-codemerge": "^1.0.0"
  },
  "scripts": {
    "start": "cargo run",
    "dev": "cargo run",
    "build": "cargo build --release"
  }
}
```

## Key Features

- **Actix-web Integration**: Full compatibility with Actix-web framework
- **RESTful API**: Clean API endpoints for content management
- **Static File Serving**: Built-in static file serving
- **Content Storage**: Thread-safe in-memory storage
- **Content Management**: Save, load, and list content functionality
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support 