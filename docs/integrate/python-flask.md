# Flask

Serve a Vite-built editor and persist document **JSON** with Flask.

Verified with Flask 3 + Vite + `on-codemerge@2.0.3` (browser smoke).

## Install

```bash
pip install flask
npm install on-codemerge
npm install -D vite
```

## Minimal example

Client (same Vite pattern as Express):

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

async function main() {
  const editor = new Editor(document.getElementById('editor'), {
    plugins: createCorePlugins(),
  });
  const loaded = await fetch('/api/doc').then((r) => r.json());
  editor.setJSON(loaded.doc);
  editor.on('docChanged', () => {
    fetch('/api/doc', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ doc: editor.getJSON() }),
    });
  });
}
main();
```

`app.py` (working smoke server):

```python
from flask import Flask, jsonify, request, send_from_directory
import json, os

app = Flask(__name__, static_folder='public', static_url_path='')
DATA = os.path.join(os.path.dirname(__file__), 'data', 'doc.json')

@app.get('/api/doc')
def get_doc():
    return jsonify(json.load(open(DATA)))

@app.put('/api/doc')
def put_doc():
    open(DATA, 'w').write(json.dumps({'doc': request.get_json()['doc']}, indent=2))
    return jsonify(ok=True)

@app.get('/')
def index():
    return send_from_directory('public', 'index.html')
```

Build client into `public/dist`, then `flask --app app run`.

## Persist

`PUT /api/doc` with `{ "doc": editor.getJSON() }`.

## Gotchas

- Point Flask `static_folder` at the folder that contains `index.html` and `dist/`.
- Persist JSON, not HTML.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
