# Slim

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Slim framework-specific documentation for **On-Codemerge**, a versatile web editor designed for easy integration into Slim applications.

## Getting Started with Slim

To integrate On-Codemerge into your Slim application, install the package:

```bash
npm install on-codemerge
```

## Slim Integration Example

Here's how to integrate On-Codemerge into a Slim application:

1. **Frontend Setup**:

```javascript title="public/js/app.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '/node_modules/on-codemerge/index.js';
import '/node_modules/on-codemerge/public.css';
import '/node_modules/on-codemerge/index.css';
import '/node_modules/on-codemerge/plugins/ToolbarPlugin/style.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/public.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/style.css';

class SlimEditor {
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
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Slim!';
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
  new SlimEditor();
});
```

2. **Include the Script in Your Slim View**:

```php title="templates/home.php"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slim On-Codemerge Editor</title>
</head>
<body>
    <div class="container">
        <h1>Slim On-Codemerge Editor</h1>
        
        <form method="post" action="/save-content">
            <div id="editor" style="min-height: 300px;"></div>
            <input type="hidden" id="editor-content" name="content" value="">
            
            <div class="controls">
                <button type="submit">Save Content</button>
                <button type="button" onclick="previewContent()">Preview</button>
            </div>

_…trimmed for the v1 archive. See source history for the full guide._
