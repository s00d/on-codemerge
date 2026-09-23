# Go Fiber

Use On-Codemerge in the browser; Fiber only stores the HTML (or Markdown) string you extract.

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
editor.setHTML(html ?? '<p>Hello from Fiber</p>');

editor.on('docChanged', () => {
  const html = editor.getHTML();
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html }),
  });
});
```

Bundle with Vite; `app.Static("/", "./dist")` for the SPA.

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

app.Get("/api/doc", func(c *fiber.Ctx) error {
    return c.JSON(docBody{HTML: storedHTML})
})

app.Put("/api/doc", func(c *fiber.Ctx) error {
    var body docBody
    if err := c.BodyParser(&body); err != nil {
        return err
    }
    // save body.HTML
    return c.JSON(body)
})
```

Same idea for `"md"` if you store Markdown.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
