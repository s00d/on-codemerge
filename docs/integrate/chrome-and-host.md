# Chrome & host

How the editor presents chrome and how to host it. Day-to-day load/save uses **HTML** or **Markdown**; JSON is the internal model if you need it.

Prefer `@codemerge/integrate` adapters / `<ocm-editor>` for app hosts — see [Integrate overview](/integrate/). This page covers chrome modes and raw `Editor` hosting.

## Install & CSS

```bash
npm install on-codemerge @codemerge/integrate
```

```ts
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
// Integrate UI entries auto-import those CSS files.
// or: import { createEditorHost } from '@codemerge/integrate';
```

## Chrome (`bar` / `page`)

| Value           | Behavior                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------ |
| `bar` (default) | Sticky toolbar + optional footer                                                           |
| `page`          | Content fills the host; toolbar/footer hidden; click opens the **same** toolbar in a popup |

```ts
const editor = new Editor(container, {
  chrome: 'page',
  plugins: createCorePlugins(),
});

editor.setHTML('<p>Hello</p>');
// or: editor.setMarkdown('# Hello');

editor.on('docChanged', () => {
  const html = editor.getHTML();
  // const md = editor.getMarkdown();
});
```

With `chrome: 'page'`, the root gets `ocm-editor-root--page`.

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

### Bar (default)

<EditorComponent :showDescription="false" />

### Page

<EditorComponent chrome="page" :showDescription="false" />

## Host packaging (isolation)

`Editor` mounts into the host element you pass. There is **no** `EditorOptions.mode` — isolation is your host’s job (direct / Shadow DOM / iframe).

### Shadow DOM

```ts
const shadow = host.attachShadow({ mode: 'open' });
const mountEl = document.createElement('div');
shadow.appendChild(mountEl);
const editor = new Editor(mountEl, { plugins: createCorePlugins() });
```

Portals default to `document.body` — override with `setPortalRoot` from `on-codemerge/sdk` inside closed shadow / iframe.

### Iframe

Prefer [`bindHostBridge`](./native-bridge.md) (`ocm-load` / `ocm-change` with `value`). Raw `Editor` sketch:

```ts
// Parent → child (protocol shape)
iframe.contentWindow?.postMessage({ type: 'ocm-load', value: savedHtml }, origin);

// Child
window.addEventListener('message', (ev) => {
  if (ev.data?.type === 'ocm-load') editor.setHTML(ev.data.value);
});
editor.on('docChanged', () => {
  parent.postMessage({ type: 'ocm-change', value: editor.getHTML(), format: 'html' }, parentOrigin);
});
```

## Extract

```ts
editor.getHTML();
editor.getMarkdown();
editor.getJSON(); // optional kernel snapshot
```

## Gotchas

- Raw `Editor`: import both CSS entry points (`index.css` + `public.css`). Integrate UI entries (`/react`, `/element`, …) load them for you; or `import '@codemerge/integrate/styles'`.
- Shadow/iframe hosts often need `setPortalRoot`.
- Construct with `new Editor(el, options)` — no v1 `HTMLEditor` / `editor.init()`.

## Related

- [Editor API](/guide/editor)
- [Authoring plugins — Portals](/guide/authoring-plugins#portals-teleport)
- [Integrate overview](/integrate/)
- [Plugins overview](/plugins/)
