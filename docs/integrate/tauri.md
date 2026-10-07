# Tauri

Desktop shell (Rust) + webview renderer. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

## Editor (webview)

Same Vite + browser editor as [Electron](./electron.md):

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});
editor.setHTML('<p>Hello from Tauri</p>');
```

Persist via Tauri commands / filesystem plugins — send `editor.getHTML()` (or Markdown) to Rust, not the kernel JSON, unless you need advanced sync.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Related

- [Electron](./electron.md)
- [Rust Axum](./rust-axum.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
