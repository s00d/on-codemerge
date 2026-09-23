# Spring

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Spring Framework-specific documentation for **On-Codemerge**, an advanced web editor designed for easy integration with Spring-based applications.

## Getting Started with Spring Framework

To integrate On-Codemerge into your Spring application, install the package:

```bash
npm install on-codemerge
```

or

```bash
yarn add on-codemerge
```

## Spring Framework Integration Example

Here's how to integrate On-Codemerge into a Spring application:

1. **Create a JavaScript File for the Editor**:

```javascript title="src/main/resources/static/js/editor.js"
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from '/node_modules/on-codemerge/index.js';
import '/node_modules/on-codemerge/public.css';
import '/node_modules/on-codemerge/index.css';
import '/node_modules/on-codemerge/plugins/ToolbarPlugin/style.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/public.css';
import '/node_modules/on-codemerge/plugins/AlignmentPlugin/style.css';

class SpringEditor {
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
    const initialContent = document.getElementById('initial-content')?.textContent || 'Welcome to On-Codemerge with Spring!';
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
  new SpringEditor();
});
```

2. **Include the JavaScript in Your Spring View**:

```html title="src/main/resources/templates/your_template.html"
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spring On-Codemerge Editor</title>
</head>
<body>
    <div class="container">
        <h1>Spring On-Codemerge Editor</h1>
        
        <form th:action="@{/save-content}" method="post">
            <div id="editor" style="min-height: 300px;"></div>

_…trimmed for the v1 archive. See source history for the full guide._
