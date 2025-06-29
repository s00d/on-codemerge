---
sidebar_position: 18
---

# Go Gin

Welcome to the Go Gin-specific documentation for **On-Codemerge**, a versatile web editor designed for integration with Gin applications.

## Getting Started with Gin

To integrate On-Codemerge into your Gin application, install the required packages:

```bash
go mod init gin-on-codemerge
go get github.com/gin-gonic/gin
npm install on-codemerge
```

## Gin Integration Example

Here's how to integrate On-Codemerge into a Gin application:

1. **Create Go Application**:

```go title="main.go"
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Content represents a content item
type Content struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// In-memory storage (use database in production)
var contents []Content
var nextID = 1

func main() {
	r := gin.Default()

	// Serve static files
	r.Static("/static", "./static")
	r.LoadHTMLGlob("templates/*")

	// Routes
	r.GET("/", func(c *gin.Context) {
		initialContent := "<p>Welcome to On-Codemerge with Gin!</p>"
		c.HTML(http.StatusOK, "editor.html", gin.H{
			"initialContent": initialContent,
		})
	})

	// API routes
	api := r.Group("/api")
	{
		api.POST("/save-content", saveContent)
		api.GET("/get-content/:id", getContent)
		api.GET("/list-contents", listContents)
	}

	log.Fatal(r.Run(":8080"))
}

func saveContent(c *gin.Context) {
	var request struct {
		Content string `json:"content"`
		Title   string `json:"title"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data",
		})
		return
	}

	content := Content{
		ID:        nextID,
		Title:     request.Title,
		Body:      request.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	contents = append(contents, content)
	nextID++

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Content saved successfully!",
		"id":      content.ID,
	})
}

func getContent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid content ID",
		})
		return
	}

	for _, content := range contents {
		if content.ID == id {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"content": content.Body,
				"title":   content.Title,
			})
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{
		"success": false,
		"message": "Content not found",
	})
}

func listContents(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"contents": contents,
	})
}
```

2. **Create HTML Template**:

```html title="templates/editor.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gin On-Codemerge Editor</title>
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
        <h1>Gin On-Codemerge Editor</h1>
        
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
    <script id="initial-content" type="text/plain">{{ .initialContent }}</script>

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
                        window.editorInstance.setHtml(data.content);
                        document.getElementById('content-title').value = data.title;
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
                    data.contents.forEach(item => {
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
                    window.editorInstance.setHtml(data.content);
                    document.getElementById('content-title').value = data.title;
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

class GinEditor {
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
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Gin!';
    this.editor.setHtml(initialContent);

    // Make editor instance globally available
    window.editorInstance = this.editor;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GinEditor();
});
```

4. **Go Modules**:

```go title="go.mod"
module gin-on-codemerge

go 1.21

require github.com/gin-gonic/gin v1.9.1

require (
	github.com/bytedance/sonic v1.9.1 // indirect
	github.com/chenzhuoyu/base64x v0.0.0-20221115062448-fe3a3abad311 // indirect
	github.com/gabriel-vasile/mimetype v1.4.2 // indirect
	github.com/gin-contrib/sse v0.1.0 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/go-playground/validator/v10 v10.14.0 // indirect
	github.com/goccy/go-json v0.10.2 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/cpuid/v2 v2.2.4 // indirect
	github.com/leodido/go-urn v1.2.4 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/pelletier/go-toml/v2 v2.0.8 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/ugorji/go/codec v1.2.11 // indirect
	golang.org/x/arch v0.3.0 // indirect
	golang.org/x/crypto v0.9.0 // indirect
	golang.org/x/net v0.10.0 // indirect
	golang.org/x/sys v0.8.0 // indirect
	golang.org/x/text v0.9.0 // indirect
	google.golang.org/protobuf v1.30.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
```

5. **Project Structure**:

```
gin-on-codemerge/
├── main.go
├── go.mod
├── go.sum
├── package.json
├── templates/
│   └── editor.html
└── static/
    └── js/
        └── editor.js
```

6. **Package.json**:

```json title="package.json"
{
  "name": "gin-on-codemerge",
  "version": "1.0.0",
  "description": "Gin app with On-Codemerge editor",
  "dependencies": {
    "on-codemerge": "^1.0.0"
  },
  "scripts": {
    "start": "go run main.go",
    "dev": "go run main.go"
  }
}
```

## Key Features

- **Gin Integration**: Full compatibility with Gin framework
- **RESTful API**: Clean API endpoints for content management
- **Template System**: Easy integration with Gin templates
- **Content Storage**: Simple in-memory storage (easily replaceable with database)
- **Content Management**: Save, load, and list content functionality
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support 