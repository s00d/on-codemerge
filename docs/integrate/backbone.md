# Backbone

`@codemerge/integrate/backbone` is an alias of `/mount` (`mountCodeMergeEditor` + CSS).

## Value + changes

```js
import Backbone from 'backbone';
import { mountCodeMergeEditor } from '@codemerge/integrate/backbone';

const View = Backbone.View.extend({
  initialize() {
    this.html = '<p></p>';
    this.handle = null;
  },
  render() {
    this.handle?.destroy();
    this.handle = mountCodeMergeEditor(this.el, {
      value: this.html,
      onChange: (value) => {
        this.html = value;
        this.trigger('change', value);
      },
    });
    return this;
  },
  remove() {
    this.handle?.destroy();
    return Backbone.View.prototype.remove.call(this);
  },
});
```

Packs / upload: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
