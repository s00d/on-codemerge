# FastAPI

Use On-Codemerge in the browser; FastAPI only stores the HTML (or Markdown) string you extract.

Python’s fastest-growing API stack in recent developer surveys.

## Install

```bash
npm install on-codemerge
pip install fastapi uvicorn
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
editor.setHTML(html ?? '<p>Hello from FastAPI</p>');

editor.on('docChanged', () => {
  fetch('/api/doc', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html: editor.getHTML() }),
  });
});
```

### Markdown

```js
editor.setMarkdown(md);
const md = editor.getMarkdown();
```

## Tiny API shape (server is secondary)

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()
store = {"html": "<p>Hello from FastAPI</p>"}

class Doc(BaseModel):
    html: str

@app.get("/api/doc")
def get_doc():
    return store

@app.put("/api/doc")
def put_doc(doc: Doc):
    store["html"] = doc.html
    return store

app.mount("/", StaticFiles(directory="dist", html=True), name="spa")
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
