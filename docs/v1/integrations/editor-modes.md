# Editor modes (v1)

> Archive: v1 API. Current guides: [Integrate](/integrate/).

Boot **HTMLEditor** on a host element, register plugins, import CSS.

## Example

```js
// v1 could host the editable surface in the page, shadow root, or iframe.
// Prefer a plain div host unless you need style isolation — then shadow/iframe.
const editor = new HTMLEditor(host);
editor.use(new ToolbarPlugin());
```
