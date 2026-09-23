# Backbone.js

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
