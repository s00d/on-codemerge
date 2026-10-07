# Native / iframe (`postMessage`)

For Flutter WebView, Electron, Tauri, Wails, Capacitor — not REST. Use `bindHostBridge` from `@codemerge/integrate/protocol`.

```ts
import { bindHostBridge } from '@codemerge/integrate/protocol';

const { host, dispose } = bindHostBridge(document.getElementById('editor')!, {
  targetOrigin: '*', // tighten in production
});

// Parent / native shell:
// iframe.contentWindow.postMessage({ type: 'ocm-load', value: '<p>…</p>' }, origin);
// listen for { type: 'ocm-change', value, format } and { type: 'ocm-ready' }
// send { type: 'ocm-destroy' } on teardown
```

Message types: `ocm-load`, `ocm-change`, `ocm-ready`, `ocm-destroy`.

For HTTP backends inside a normal browser app, prefer [Persistence](./persistence.md) instead.

## Related

- [Persistence](./persistence.md)
- [Server + Vite](./server-vite.md)
- Stack deltas: [Flutter](./flutter.md), [Electron](./electron.md), [Tauri](./tauri.md), [Wails](./wails.md), [Capacitor](./capacitor.md)
