# Capacitor

WebView host — [Server + Vite](./server-vite.md) + [Persistence](./persistence.md) for HTTP APIs, or [Native bridge](./native-bridge.md) for shell `postMessage`:

```ts
import { bindHostBridge } from '@codemerge/integrate/protocol';

bindHostBridge(document.getElementById('editor')!, { targetOrigin: '*' });
```

## Related

- [Native bridge](./native-bridge.md)
- [Persistence](./persistence.md)
