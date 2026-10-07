# Wails

WebView host — [Server + Vite](./server-vite.md) + [Persistence](./persistence.md), or [Native bridge](./native-bridge.md):

```ts
import { bindHostBridge } from '@codemerge/integrate/protocol';

bindHostBridge(document.getElementById('editor')!, { targetOrigin: '*' });
```

## Related

- [Native bridge](./native-bridge.md)
- [Persistence](./persistence.md)
