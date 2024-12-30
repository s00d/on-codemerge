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
npm i --save on-codemerge
```

## Backbone.js Integration Example

Integrating On-Codemerge in a Backbone.js application can be done by creating a custom view:

1. **Create a Backbone View**: You will need to create a Backbone view for the On-Codemerge editor. This view will handle initializing and rendering the editor.

```javascript title="OnCodemergeView.js"
import Backbone from 'backbone';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

const OnCodemergeView = Backbone.View.extend({
  initialize: async function () {
    this.editor = new HTMLEditor(this.el);

    await this.editor.setLocale('ru'); // Set locale (optional)

    this.editor.use(new ToolbarPlugin());
    this.editor.use(new AlignmentPlugin());
    // ... register other modules

    this.editor.subscribeToContentChange((newContent) => {
      console.log('Content changed:', newContent);
    });
  },

  render: function () {
    // Optional: Set initial content
    this.editor.setHtml('Initial content goes here');
    console.log(this.editor.getHtml()); // Log initial content
    return this;
  },

  remove: function () {
    this.editor.destroy(); // Clean up the editor
    Backbone.View.prototype.remove.call(this);
  },
});

export default OnCodemergeView;
```

### Key Points

1. **HTMLEditor Initialization**: The `HTMLEditor` is initialized with the container element (`this.el`).
2. **Locale Setting**: The `setLocale` method is used to set the editor's language (e.g., `'ru'` for Russian).
3. **Plugin Registration**: Plugins like `ToolbarPlugin` and `AlignmentPlugin` are registered using the `use` method.
4. **Content Subscription**: The `subscribeToContentChange` method listens for changes in the editor's content.
5. **HTML Content Management**: The `setHtml` and `getHtml` methods are used to set and retrieve the editor's content in HTML format.

2. **Instantiate and Render the View**: In your application, create an instance of this view and render it.

```javascript title="app.js"
import OnCodemergeView from './OnCodemergeView';

const editorView = new OnCodemergeView({ el: '#editorContainer' });
editorView.render();
```

### Example with Additional Plugins

To add more plugins, import and register them similarly:

```javascript
import { TablePlugin, ImagePlugin } from 'on-codemerge';

// Inside initialize
this.editor.use(new TablePlugin());
this.editor.use(new ImagePlugin());
```

### Usage

1. Add a container element in your HTML (e.g., `<div id="editorContainer"></div>`).
2. Create an instance of `OnCodemergeView` and attach it to the container element.
3. Call the `render` method to initialize the editor and set initial content.

This approach ensures seamless integration of On-Codemerge into Backbone.js applications using the latest plugin version.
