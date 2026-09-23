# Backbone.js

Embed On-Codemerge in a Backbone view. Persist **JSON** on the model (`getJSON` / `setJSON`), not HTML.

Verified with Vite + `backbone@1.6` + `on-codemerge@2.0.3` (build + browser smoke).

## Install

```bash
npm install on-codemerge backbone jquery underscore
```

## Minimal example

Working view from the temp demo:

```js
import Backbone from 'backbone';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const INITIAL = {
  version: 1,
  doc: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello from Backbone' }] }],
  },
};

const DocModel = Backbone.Model.extend({
  defaults: { doc: INITIAL },
});

const EditorView = Backbone.View.extend({
  initialize() {
    this.$el.html('<div class="host" style="min-height:300px"></div>');
    this.editor = new Editor(this.$('.host')[0], { plugins: createCorePlugins() });
    this.editor.setJSON(this.model.get('doc'));
    this.editor.on('docChanged', () => {
      this.model.set('doc', this.editor.getJSON());
    });
  },
  remove() {
    this.editor?.destroy();
    return Backbone.View.prototype.remove.call(this);
  },
});

const model = new DocModel();
new EditorView({ el: '#app', model });
```

## Persist

```js
this.editor.on('docChanged', () => {
  const json = this.editor.getJSON();
  this.model.set('doc', json);
  // sync model to your API
});
```

## Gotchas

- Pass a real DOM node: `this.$('.host')[0]`, not a jQuery object.
- Destroy the editor in `remove()`.
- Import both CSS entry points.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
