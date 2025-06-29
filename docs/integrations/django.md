---
sidebar_position: 11
---

# Django

Welcome to the Django-specific documentation for **On-Codemerge**, a versatile web editor designed for easy integration with Django applications.

## Getting Started with Django

To use On-Codemerge in your Django project, set up the frontend environment where the editor will be utilized.

### Installation

Install `on-codemerge` via npm or yarn:

```bash
npm install on-codemerge
```

or

```bash
yarn add on-codemerge
```

## Django Integration Example

Here's how to integrate On-Codemerge into a Django application:

1. **Create Your JavaScript File**: Create a new JavaScript file in your Django static files.

```javascript title="static/js/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '/static/node_modules/on-codemerge/index.js';
import '/static/node_modules/on-codemerge/public.css';
import '/static/node_modules/on-codemerge/index.css';
import '/static/node_modules/on-codemerge/plugins/ToolbarPlugin/style.css';
import '/static/node_modules/on-codemerge/plugins/AlignmentPlugin/public.css';
import '/static/node_modules/on-codemerge/plugins/AlignmentPlugin/style.css';

class DjangoEditor {
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
      this.updateHiddenField(newContent);
      console.log('Content changed:', newContent);
    });

    // Set initial content
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Django!';
    this.editor.setHtml(initialContent);
  }

  updateHiddenField(content) {
    const hiddenField = document.getElementById('editor-content');
    if (hiddenField) {
      hiddenField.value = content;
    }
  }

  getContent() {
    return this.editor ? this.editor.getHtml() : '';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DjangoEditor();
});
```

2. **Include the JavaScript in Your Django Template**: In your Django template, include the JavaScript file.

```html title="templates/your_template.html"
{% load static %}

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Django On-Codemerge Editor</title>
    <link rel="stylesheet" href="{% static 'node_modules/on-codemerge/public.css' %}">
    <link rel="stylesheet" href="{% static 'node_modules/on-codemerge/index.css' %}">
    <link rel="stylesheet" href="{% static 'node_modules/on-codemerge/plugins/ToolbarPlugin/style.css' %}">
    <link rel="stylesheet" href="{% static 'node_modules/on-codemerge/plugins/AlignmentPlugin/public.css' %}">
    <link rel="stylesheet" href="{% static 'node_modules/on-codemerge/plugins/AlignmentPlugin/style.css' %}">
</head>
<body>
    <div class="container">
        <h1>Django On-Codemerge Editor</h1>
        
        <form method="post">
            {% csrf_token %}
            <div id="editor" style="min-height: 300px;"></div>
            <input type="hidden" id="editor-content" name="content" value="">
            
            <div class="controls">
                <button type="submit">Save Content</button>
                <button type="button" onclick="previewContent()">Preview</button>
            </div>
        </form>
        
        <div id="preview" style="display: none;">
            <h3>Preview:</h3>
            <div id="preview-content"></div>
        </div>
    </div>

    <!-- Initial content (if any) -->
    {% if initial_content %}
    <script id="initial-content" type="text/plain">{{ initial_content|safe }}</script>
    {% endif %}

    <script type="module" src="{% static 'js/editor.js' %}"></script>
    <script>
        function previewContent() {
            const content = document.getElementById('editor-content').value;
            const previewDiv = document.getElementById('preview');
            const previewContent = document.getElementById('preview-content');
            
            previewContent.innerHTML = content;
            previewDiv.style.display = 'block';
        }
    </script>
</body>
</html>
```

3. **Django View Example**:

```python title="views.py"
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def editor_view(request):
    if request.method == 'POST':
        content = request.POST.get('content', '')
        # Save content to database or file
        print(f"Saving content: {content}")
        return JsonResponse({'success': True})
    
    # Get initial content from database if needed
    initial_content = '<p>Welcome to On-Codemerge with Django!</p>'
    
    return render(request, 'your_template.html', {
        'initial_content': initial_content
    })

@csrf_exempt
def save_content(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        content = data.get('content', '')
        # Save content logic here
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})
```

4. **Collect Static Files**: Run Django's `collectstatic` command to ensure all static files are gathered in the static files directory.

```bash
python manage.py collectstatic
```

## Key Features

- **Django Integration**: Full compatibility with Django's template system
- **Static Files**: Proper static file handling with Django's static files system
- **Form Integration**: Easy integration with Django forms
- **CSRF Protection**: Built-in CSRF token support
- **Content Management**: Real-time content updates and saving
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support
