# Chrome & host

How the editor presents chrome and how to host it. Document **source of truth stays JSON** (`getJSON` / `setJSON`) regardless of packaging.

## Chrome (`bar` / `page`)

| Value           | Behavior                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| `bar` (default) | Sticky toolbar + optional footer                                                           |
| `page`          | Content fills the host; toolbar/footer hidden; click opens the **same** toolbar in a popup |

```ts
import { Editor, createDefaultPlugins } from 'on-codemerge';

const editor = new Editor(container, {
  chrome: 'page',
  plugins: createDefaultPlugins(),
});
```

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

### Bar (default)

<EditorComponent :showDescription="false" />

### Page

<EditorComponent chrome="page" :showDescription="false" />

## Host packaging (isolation)

`Editor` mounts into the host element you pass. There is **no** `EditorOptions.mode` (`direct` / `shadowRoot` / `iframe`) — isolation is your host’s job:

| Approach         | When                                 | Notes                                                       |
| ---------------- | ------------------------------------ | ----------------------------------------------------------- |
| Direct (default) | SPA / simple embed                   | Mount on a normal DOM node                                  |
| Shadow DOM host  | Style isolation / web components     | Attach shadow, mount editor inside, route portals if needed |
| Iframe host      | Strong isolation / third-party embed | Load editor page (or inject) inside iframe document         |

### Shadow DOM

```ts
const host = document.createElement('div');
container.appendChild(host);
const shadow = host.attachShadow({ mode: 'open' });
const mountEl = document.createElement('div');
shadow.appendChild(mountEl);

// Import CSS into the shadow (or inject link/style nodes) as your bundler allows.
const editor = new Editor(mountEl, {
  plugins: createDefaultPlugins(),
});
```

Overlays (popup / menu / notify / toolbar dropdowns) use SDK **portals** under `document.body` by default. For a closed shadow or iframe, override portal roots — see [Authoring plugins — Portals](/guide/authoring-plugins#portals-teleport):

```ts
import { setPortalRoot } from 'on-codemerge/sdk';

setPortalRoot('popup', shadow);
setPortalRoot('menu', shadow);
setPortalRoot('notify', shadow);
```

### Iframe

Serve a minimal HTML page that loads On-Codemerge and posts JSON to the parent (`postMessage`), or inject the editor into `iframe.contentDocument` after load. Prefer JSON over HTML for persistence across the frame boundary.

```ts
// Parent
iframe.contentWindow?.postMessage({ type: 'ocm-load', doc: savedJson }, origin);

// Child (editor page)
window.addEventListener('message', (ev) => {
  if (ev.data?.type === 'ocm-load') editor.setJSON(ev.data.doc);
});
editor.on('docChanged', () => {
  parent.postMessage({ type: 'ocm-save', doc: editor.getJSON() }, parentOrigin);
});
```

## Comparison (host choice)

| Feature          | Direct                  | Shadow host                | Iframe host       |
| ---------------- | ----------------------- | -------------------------- | ----------------- |
| CSS isolation    | Low                     | High (scoped)              | Full              |
| DOM isolation    | Low                     | Medium                     | Full              |
| Integration cost | Low                     | Medium                     | Higher            |
| Portals          | Default `document.body` | Often need `setPortalRoot` | Separate document |

## Best practices

1. Prefer **direct** mount unless you have real style conflicts.
2. Use **Shadow DOM** for widgets / design-system embeds; fix portals.
3. Use **iframe** only when you need a hard security/style boundary.
4. Always persist **JSON** (`getJSON` / `setJSON`), not HTML, as SoT.
5. Test overlays (toolbar menus, popups) in your chosen host.

## Related

- [Editor API](/guide/editor) — `chrome`, `colorScheme`, document API
- [Authoring plugins — Portals](/guide/authoring-plugins#portals-teleport)
- [Integrate overview](/integrate/)
