# Python Flask

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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

_…trimmed for the v1 archive. See source history for the full guide._
