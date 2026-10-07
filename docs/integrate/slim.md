# Slim

Family: **[Server + Vite](./server-vite.md)** + **[Persistence](./persistence.md)** + **[Host config](./host-config.md)**.

## Delta

- Bundle a JS entry (Vite/Webpack) that imports `/element` + Persistence.
- Twig/PHP view outputs `<ocm-editor>`.
- Point document + media routes at your Slim handlers.

```js
import '@codemerge/integrate/element';
import { bindPersistence, restPersistence } from '@codemerge/integrate/protocol';

const el = document.querySelector('ocm-editor');

function wire() {
  bindPersistence(
    el,
    restPersistence({
      url: '/notes/1',
      parse: (data) => data.body,
      serialize: (value) => ({ body: value }),
    })
  );
}

el?.addEventListener('ready', wire, { once: true });
el?.configure({
  pack: 'default',
  image: { endpoints: { upload: '/media' } },
  fileUpload: { endpoints: { upload: '/files', download: '/files' } },
});
```

## Related

- [Host config](./host-config.md)
- [Server + Vite](./server-vite.md)
- [Persistence](./persistence.md)
