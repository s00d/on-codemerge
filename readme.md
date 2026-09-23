# on-codemerge

Virtual-document WYSIWYG editor. JSON `doc` is the source of truth. Plugins register into a **core-owned** toolbar / popup / menu SDK.

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins, insertText } from 'on-codemerge';

const editor = new Editor(document.getElementById('editor')!, {
  plugins: createDefaultPlugins(),
});
editor.run(insertText('Hello'));
```

**Docs:** [OnCodemerge documentation](https://s00d.github.io/on-codemerge/) (Guide, Plugins, Integrate).

Plugins use only `core.*` and `editor.toolbar` / `editor.openPopup` — never deep-import the kernel from app code.

## License

MIT
