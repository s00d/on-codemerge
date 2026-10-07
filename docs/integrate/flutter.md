# Flutter

Flutter WebView — load HTML that mounts the editor, then [Native bridge](./native-bridge.md).

```ts
import { bindHostBridge } from '@codemerge/integrate/protocol';

bindHostBridge(document.getElementById('editor')!, {
  targetOrigin: '*', // tighten in production
});
```

Dart shell: `postMessage({ type: 'ocm-load', value })`, listen for `ocm-change` / `ocm-ready`, send `ocm-destroy` on teardown.

## Related

- [Native bridge](./native-bridge.md)
- [Persistence](./persistence.md)
