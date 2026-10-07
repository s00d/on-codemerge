# Blazor

Family: **[Server + Vite](./server-vite.md)** + **[Persistence](./persistence.md)**.

Prefer JS interop host page with `/element` + Persistence; or iframe + [Native bridge](./native-bridge.md).

Custom API controller URL.

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
