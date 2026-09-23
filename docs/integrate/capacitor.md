# Capacitor

Native shell (iOS/Android) around a web editor. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge @capacitor/core
```

## Editor

```js
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

const editor = new Editor(document.getElementById('editor'), {
  plugins: createCorePlugins(),
});
editor.setHTML('<p>Hello from Capacitor</p>');
```

Store `getHTML()` / `getMarkdown()` with Preferences, Filesystem, or your API.

### Extract

```js
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Soft keyboard / viewport: see [Chrome & host](./chrome-and-host.md).
- Prefer `chrome: 'bar'` on small screens if the page chrome fights the native UI.

## Related

- [Flutter](./flutter.md)
- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
