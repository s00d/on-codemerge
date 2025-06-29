---
sidebar_position: 7
---

# Backbone.js

Welcome to the Backbone.js-specific documentation for **On-Codemerge**, a versatile web editor designed for integration with Backbone.js, a framework known for its lightweight and straightforward approach to building web applications.

## Getting Started with Backbone.js

To integrate On-Codemerge into your Backbone.js project, start with installing the package.

### Installation

Execute the following command in your Backbone.js project directory:

```bash
npm install on-codemerge
```

## Backbone.js Integration Example

Integrating On-Codemerge in a Backbone.js application can be done by creating a custom view:

1. **Create a Backbone View**: You will need to create a Backbone view for the On-Codemerge editor. This view will handle initializing and rendering the editor.

```javascript title="OnCodemergeView.js"
import Backbone from 'backbone';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

const OnCodemergeView = Backbone.View.extend({
  initialize: function (options) {
    this.options = options || {};
    this.editor = null;
    this.initEditor();
  },

  async initEditor() {
    if (this.el) {
      this.editor = new HTMLEditor(this.el);

      // Set locale
      await this.editor.setLocale('ru');

      // Register plugins
      this.editor.use(new ToolbarPlugin());
      this.editor.use(new AlignmentPlugin());

      // Subscribe to content changes
      this.editor.subscribeToContentChange((newContent) => {
        this.trigger('content:change', newContent);
        console.log('Content changed:', newContent);
      });

      // Set initial content
      const initialContent = this.options.initialContent || 'Welcome to On-Codemerge with Backbone.js!';
      this.editor.setHtml(initialContent);
    }
  },

  render: function () {
    // The editor is already initialized in initialize
    return this;
  },

  getContent: function () {
    return this.editor ? this.editor.getHtml() : '';
  },

  setContent: function (content) {
    if (this.editor) {
      this.editor.setHtml(content);
    }
  },

  remove: function () {
    if (this.editor) {
      this.editor.destroy();
    }
    Backbone.View.prototype.remove.call(this);
  },
});

export default OnCodemergeView;
```

2. **Instantiate and Render the View**: In your application, create an instance of this view and render it.

```javascript title="app.js"
import Backbone from 'backbone';
import OnCodemergeView from './OnCodemergeView';

// Create the main application
const App = Backbone.View.extend({
  el: '#app',

  initialize: function () {
    this.editorView = new OnCodemergeView({ 
      el: '#editorContainer',
      initialContent: '<p>Initial content from Backbone.js</p>'
    });

    // Listen for content changes
    this.editorView.on('content:change', (content) => {
      console.log('Content changed in app:', content);
      this.saveContent(content);
    });
  },

  render: function () {
    this.editorView.render();
    return this;
  },

  saveContent: function (content) {
    // Save content to server or localStorage
    console.log('Saving content:', content);
    localStorage.setItem('editor-content', content);
  },

  loadContent: function () {
    const savedContent = localStorage.getItem('editor-content');
    if (savedContent) {
      this.editorView.setContent(savedContent);
    }
  }
});

// Initialize the application
const app = new App();
app.render();
```

3. **HTML Template**:

```html title="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Backbone.js On-Codemerge App</title>
</head>
<body>
  <div id="app">
    <h1>Backbone.js App with On-Codemerge</h1>
    <div id="editorContainer" style="min-height: 300px;"></div>
    <div class="controls">
      <button onclick="app.saveContent(app.editorView.getContent())">Save Content</button>
      <button onclick="app.loadContent()">Load Content</button>
    </div>
  </div>

  <script type="module" src="app.js"></script>
</body>
</html>
```

### Example with Additional Plugins

To add more plugins, import and register them similarly:

```javascript
import { TablePlugin, ImagePlugin } from 'on-codemerge';

// Inside initEditor method
this.editor.use(new TablePlugin());
this.editor.use(new ImagePlugin());
```

## Key Features

- **Backbone.js Integration**: Full compatibility with Backbone.js View system
- **Event System**: Proper event handling with Backbone events
- **Content Management**: Easy content getting and setting
- **Plugin System**: Full plugin support
- **Localization**: Multi-language support
- **Lifecycle Management**: Proper cleanup in remove method
