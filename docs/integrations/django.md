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
npm install --save on-codemerge
```

or

```bash
yarn add on-codemerge
```

## Django Integration Example

Here's how to integrate On-Codemerge into a Django application:

1. **Create Your JavaScript File**: Create a new JavaScript file in your Django static files.

```javascript title="static/js/editor.js"
import 'on-codemerge/index.css';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', async () => {
  const editorElement = document.getElementById('editor');
  if (editorElement) {
    const editor = new HTMLEditor(editorElement);

    await editor.setLocale('ru');

    editor.use(new ToolbarPlugin());
    editor.use(new AlignmentPlugin());

    editor.subscribeToContentChange((newContent) => {
      console.log('Content changed:', newContent);
    });

    editor.setHtml('Initial content goes here');
    console.log(editor.getHtml());
  }
});
```

2. **Include the JavaScript in Your Django Template**: In your Django template, include the JavaScript file.

```html title="templates/your_template.html"
{% load static %}

<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Head Contents -->
</head>
<body>
    <div id="editor"></div>
    <script src="{% static 'js/editor.js' %}"></script>
</body>
</html>
```

3. **Collect Static Files**: Run Django's `collectstatic` command to ensure all static files are gathered in the static files directory.

```bash
python manage.py collectstatic
```
