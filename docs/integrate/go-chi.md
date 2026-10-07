# Go Chi

Use On-Codemerge in the browser; Chi only stores the HTML (or Markdown) string you extract.

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
editor.setHTML(html ?? '<p>Hello from Chi</p>');

editor.on('docChanged', () => {
  const html = editor.getHTML();
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html }),
  });
});
```

Bundle with Vite; `http.FileServer(http.Dir("dist"))` (often wrapped with `StripPrefix`) for assets.

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

r.Get("/api/doc", func(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(docBody{HTML: storedHTML})
})

r.Put("/api/doc", func(w http.ResponseWriter, r *http.Request) {
    var body docBody
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    // save body.HTML
    json.NewEncoder(w).Encode(body)
})
```

Same idea for `"md"` if you store Markdown.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
