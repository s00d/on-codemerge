# Express.js

> Archive: v1 API. Current guides: [Integrate](/integrate/).

Boot **HTMLEditor** on a host element, register plugins, import CSS.

## Example

```js
// Serve a static page that loads the editor bundle.
app.use(express.static('public'));
// public/index.html → <div id="app"> + script that does new HTMLEditor(...)
```
