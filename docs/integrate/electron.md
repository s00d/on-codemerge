# Electron

BrowserWindow loads your page. Prefer [Server + Vite](./server-vite.md) + [Persistence](./persistence.md) in the renderer. Isolated iframe → [Native bridge](./native-bridge.md):

```ts
import { bindHostBridge } from '@codemerge/integrate/protocol';

bindHostBridge(document.getElementById('editor')!, {
  messageTarget: window.parent,
  targetOrigin: '*',
});
```

## Related

- [Native bridge](./native-bridge.md)
- [Persistence](./persistence.md)
