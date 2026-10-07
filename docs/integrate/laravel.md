# Laravel

Family: **[Server + Vite](./server-vite.md)** + **[Persistence](./persistence.md)** + **[Host config](./host-config.md)**. No Composer package.

## Delta

- Vite entry: `resources/js/ocm-editor.js` + `@vite([...])` in Blade.
- CSRF: `meta[name="csrf-token"]` → header `X-CSRF-TOKEN`.
- Document route + media upload routes are **yours**.

## Example

`resources/js/ocm-editor.js`:

```js
import '@codemerge/integrate/element';
import { bindPersistence, restPersistence } from '@codemerge/integrate/protocol';

const el = document.querySelector('ocm-editor');
const pageId = el?.dataset.pageId ?? '1';
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

function wire() {
  bindPersistence(
    el,
    restPersistence({
      url: `/pages/${pageId}`,
      headers: () => ({ 'X-CSRF-TOKEN': csrf() }),
      parse: (data) => data.content,
      serialize: (value) => ({ content: value }),
    })
  );
}

// Listen before configure — `ready` fires synchronously on remount.
el?.addEventListener('ready', wire, { once: true });
el?.configure({
  pack: 'default',
  image: {
    endpoints: { upload: '/media', list: '/media', delete: '/media' },
    headers: () => ({ 'X-CSRF-TOKEN': csrf() }),
    useEmulation: false,
  },
  fileUpload: {
    endpoints: { upload: '/files', download: '/files', list: '/files', delete: '/files' },
    headers: () => ({ 'X-CSRF-TOKEN': csrf() }),
    useEmulation: false,
  },
});
```

Blade:

```blade
@vite(['resources/js/ocm-editor.js'])
<meta name="csrf-token" content="{{ csrf_token() }}">
<ocm-editor data-page-id="{{ $page->id }}" format="html" chrome="bar"></ocm-editor>
```

## Related

- [Host config](./host-config.md)
- [Server + Vite](./server-vite.md)
- [Persistence](./persistence.md)
