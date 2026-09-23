# Backbone.js

Embed On-Codemerge in a Backbone view. Load / save with **HTML** (or Markdown) on the model.

## Install

```bash
npm install on-codemerge backbone jquery underscore
```

## Minimal example

```js
import Backbone from 'backbone';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const DocModel = Backbone.Model.extend({
  defaults: { html: '<p>Hello from Backbone</p>' },
});

const EditorView = Backbone.View.extend({
  initialize() {
    this.$el.html('<div class="host" style="min-height:300px"></div>');
    this.editor = new Editor(this.$('.host')[0], { plugins: createCorePlugins() });
    this.editor.setHTML(this.model.get('html'));
    this.editor.on('docChanged', () => {
      this.model.set('html', this.editor.getHTML());
    });
  },
  remove() {
    this.editor?.destroy();
    return Backbone.View.prototype.remove.call(this);
  },
});

new EditorView({ el: '#app', model: new DocModel() });
```

### Extract

```js
const html = this.editor.getHTML();
const md = this.editor.getMarkdown();
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
