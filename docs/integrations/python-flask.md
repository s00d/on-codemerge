---
sidebar_position: 17
---

# Python Flask

Welcome to the Python Flask-specific documentation for **On-Codemerge**, a versatile web editor designed for integration with Flask applications.

## Getting Started with Flask

To integrate On-Codemerge into your Flask application, install the required packages:

```bash
pip install flask
npm install on-codemerge
```

## Flask Integration Example

Here's how to integrate On-Codemerge into a Flask application:

1. **Create Flask Application**:

```python title="app.py"
from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Simple in-memory storage (use database in production)
contents = []

@app.route('/')
def index():
    initial_content = '<p>Welcome to On-Codemerge with Flask!</p>'
    return render_template('editor.html', initial_content=initial_content)

@app.route('/api/save-content', methods=['POST'])
def save_content():
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        # Save content to storage
        content_item = {
            'id': len(contents) + 1,
            'content': content,
            'created_at': datetime.now().isoformat(),
            'title': data.get('title', 'Untitled')
        }
        contents.append(content_item)
        
        return jsonify({
            'success': True,
            'message': 'Content saved successfully!',
            'id': content_item['id']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/get-content/<int:content_id>')
def get_content(content_id):
    try:
        content_item = next((item for item in contents if item['id'] == content_id), None)
        if content_item:
            return jsonify({
                'success': True,
                'content': content_item['content'],
                'title': content_item['title']
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Content not found'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/list-contents')
def list_contents():
    try:
        return jsonify({
            'success': True,
            'contents': contents
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
```

2. **Create HTML Template**:

```html title="templates/editor.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flask On-Codemerge Editor</title>
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
        <h1>Flask On-Codemerge Editor</h1>
        
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
    <script id="initial-content" type="text/plain">{{ initial_content|safe }}</script>

    <script type="module" src="{{ url_for('static', filename='js/editor.js') }}"></script>
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

class FlaskEditor {
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
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Flask!';
    this.editor.setHtml(initialContent);

    // Make editor instance globally available
    window.editorInstance = this.editor;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FlaskEditor();
});
```

4. **Requirements.txt**:

```txt title="requirements.txt"
Flask==2.3.3
Werkzeug==2.3.7
```

5. **Project Structure**:

```
flask-on-codemerge/
├── app.py
├── requirements.txt
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
  "name": "flask-on-codemerge",
  "version": "1.0.0",
  "description": "Flask app with On-Codemerge editor",
  "dependencies": {
    "on-codemerge": "^1.0.0"
  },
  "scripts": {
    "start": "python app.py",
    "dev": "python app.py"
  }
}
```

## Key Features

- **Flask Integration**: Full compatibility with Flask framework
- **RESTful API**: Clean API endpoints for content management
- **Template System**: Easy integration with Jinja2 templates
- **Content Storage**: Simple in-memory storage (easily replaceable with database)
- **Content Management**: Save, load, and list content functionality
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support 