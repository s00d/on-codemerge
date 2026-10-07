# Server + Vite (`<ocm-editor>`)

Pattern for Laravel, Slim, Express, Django, Go, … — **npm peers**, Vite (or any bundler), Web Component, **your** load/save + upload URLs.

CSS loads with `@codemerge/integrate/element`.

Full construct control (packs, upload, locale, collab): [Host config](./host-config.md).

## Vite entry

```js
import '@codemerge/integrate/element';
import { bindPersistence, restPersistence } from '@codemerge/integrate/protocol';

const el = document.querySelector('ocm-editor');
const pageId = el?.dataset.pageId ?? '1';

const headers = () => ({
  // CSRF / Bearer — stack-specific
});

function wire() {
  bindPersistence(
    el,
    restPersistence({
      url: `/api/pages/${pageId}`,
      headers,
      parse: (data) => data.content,
      serialize: (value) => ({ content: value }),
    })
  );
}

// Listen *before* configure — remount fires `ready` again.
// If you skip configure, use `if (el?.host) wire(); else el?.addEventListener('ready', …)`.
el?.addEventListener('ready', wire, { once: true });
el?.configure({
  pack: 'default',
  image: {
    endpoints: { upload: '/api/media', list: '/api/media', delete: '/api/media' },
    headers,
  },
  fileUpload: {
    endpoints: {
      upload: '/api/files',
      download: '/api/files',
      list: '/api/files',
      delete: '/api/files',
    },
    headers,
  },
});
```

## Markup

```html
<ocm-editor data-page-id="42" format="html" chrome="bar" pack="default"></ocm-editor>
<script type="module" src="/assets/editor.js"></script>
```

Without the Web Component, mount a plain host (host options + persistence in one call):

```js
import { createEditorHost } from '@codemerge/integrate';
import { bindPersistence, restPersistence } from '@codemerge/integrate/protocol';

bindPersistence(document.getElementById('editor'), {
  ...restPersistence({
    url: '/your-endpoint',
    parse: (d) => d.content,
    serialize: (value) => ({ content: value }),
  }),
  pack: 'default',
  image: { endpoints: { upload: '/api/media' } },
});
```

## Full control (callbacks)

```js
bindPersistence(el, {
  pack: 'default',
  image: { endpoints: { upload: '/api/media' } },
  load: async () => {
    const r = await fetch(`/notes/${id}`);
    const j = await r.json();
    return j.text;
  },
  save: async (value) => {
    await fetch(`/notes/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: value }),
    });
  },
});
```

## Related

- [Host config](./host-config.md)
- [Persistence](./persistence.md)

Stack pages (Laravel, Slim, …) only add CSRF / `@vite` / template deltas.
