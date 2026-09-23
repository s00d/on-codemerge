# Django

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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

_…trimmed for the v1 archive. See source history for the full guide._
