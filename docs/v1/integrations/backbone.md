# Backbone.js

> Archive: v1 API. Current guides: [Integrate](/integrate/).

Boot **HTMLEditor** on a host element, register plugins, import CSS.

## Example

```js
const editor = new HTMLEditor(this.el.querySelector('#editor'));
editor.use(new ToolbarPlugin());
// on view remove → editor.destroy()
```
