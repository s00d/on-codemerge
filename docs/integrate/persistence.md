# Persistence (load / save)

Mount alone is not an integration. Wire **your** backend with `bindPersistence` (callbacks) or `restPersistence` (fetch sugar). No fixed `/api/doc` path and no required JSON shape.

```bash
npm install on-codemerge @codemerge/integrate
```

## Callbacks (any backend)

```ts
import { createEditorHost } from '@codemerge/integrate';
import { bindPersistence } from '@codemerge/integrate/protocol';

const host = createEditorHost(document.getElementById('editor')!, { format: 'html' });

const io = bindPersistence(host, {
  async load() {
    // GraphQL, localStorage, IPC — anything
    return localStorage.getItem('draft') ?? '<p></p>';
  },
  async save(value, format) {
    localStorage.setItem('draft', value);
    void format;
  },
  debounceMs: 300,
});

// later: await io.flush(); io.dispose();
```

`load` may return a string or `{ value, format? }`.

## REST sugar (custom URL + shape)

```ts
import '@codemerge/integrate/element';
import { bindPersistence, restPersistence } from '@codemerge/integrate/protocol';

const el = document.querySelector('ocm-editor');

function wire() {
  bindPersistence(
    el,
    restPersistence({
      url: '/admin/pages/5/body', // ← your route
      method: { load: 'GET', save: 'PUT' }, // or POST / PATCH
      headers: () => ({
        'X-CSRF-TOKEN':
          document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
      }),
      parse: (data) => (data as { content: string }).content,
      serialize: (value) => ({ content: value }),
      debounceMs: 400,
    })
  );
}

// Import may upgrade `<ocm-editor>` sync — `ready` can fire before listeners attach.
if (el?.host) wire();
else el?.addEventListener('ready', wire, { once: true });
```

Separate URLs:

```ts
restPersistence({
  url: { load: '/drafts/1', save: '/drafts/1/save' },
  method: { save: 'POST' },
  parse: (d) => (d as { html: string }).html,
  serialize: (value, format) => ({ html: value, format }),
});
```

## API surface

| Helper                                                           | Role                                                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `bindPersistence(target, { load, save, debounceMs?, onError? })` | Core IO. `target`: `HTMLElement`, `EditorHostHandle`, or ready `<ocm-editor>` |
| `restPersistence({ url, parse, serialize, headers?, method? })`  | Builds `{ load, save }` via `fetch`                                           |
| Return                                                           | `{ host, reload, flush, dispose }`                                            |

Example OpenAPI (not a product contract): package `schemas/rest-persistence.example.yaml`.

## Manual (no helper)

Same as before — fine for React state:

```ts
editor.setHTML(await load());
editor.on('docChanged', () => {
  void save(editor.getHTML());
});
```

## Related

- [Host config](./host-config.md) — upload / plugins / locale
- [Server + Vite](./server-vite.md)
- [React](./react.md)
- [Native / iframe](./native-bridge.md)
