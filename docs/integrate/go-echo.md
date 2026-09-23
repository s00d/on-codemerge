# Go Echo

Use On-Codemerge in the browser; Echo only stores the HTML (or Markdown) string you extract.

## Install

```bash
npm install on-codemerge
```

## Editor (what matters)

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});

const { html } = await fetch('/api/doc').then((r) => r.json());
editor.setHTML(html ?? '<p>Hello from Echo</p>');

editor.on('docChanged', () => {
  const html = editor.getHTML();
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html }),
  });
});
```

Bundle with Vite and serve `dist` via `echo.Static` or `echo.StaticFS`.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Tiny API shape (server is secondary)

```go
type docBody struct {
    HTML string `json:"html"`
}

e.GET("/api/doc", func(c echo.Context) error {
    return c.JSON(http.StatusOK, docBody{HTML: storedHTML})
})

e.PUT("/api/doc", func(c echo.Context) error {
    var body docBody
    if err := c.Bind(&body); err != nil {
        return err
    }
    // save body.HTML
    return c.JSON(http.StatusOK, body)
})
```

Same idea for `"md"` if you store Markdown.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
