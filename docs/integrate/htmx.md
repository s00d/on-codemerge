# HTMX

Family: **[Server + Vite](./server-vite.md)** + **[Persistence](./persistence.md)**.

HTMX can swap the host node; editor JS still owns Persistence (avoid full swap of the editor root while mounted).

Save via `restPersistence` or HTMX forms separately.

```js
import '@codemerge/integrate/element';
import { bindPersistence, restPersistence } from '@codemerge/integrate/protocol';

const el = document.querySelector('ocm-editor');

function wire() {
  bindPersistence(
    el,
    restPersistence({
      url: '/your-endpoint', // change me
      headers: () => ({/* stack auth / CSRF */}),
      parse: (d) => d.content,
      serialize: (value) => ({ content: value }),
    })
  );
}

// `<ocm-editor>` may upgrade sync on import — `ready` can fire before listeners attach.
if (el?.host) wire();
else el?.addEventListener('ready', wire, { once: true });
```

## Related

- [Server + Vite](./server-vite.md)
- [Persistence](./persistence.md)
