# On-Codemerge v1 (archive)

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).

v1 treats **HTML in the contenteditable** as the source of truth. You create an `HTMLEditor`, then register plugins with `editor.use(...)`.

## Install

```bash
npm install on-codemerge@1
```

## Quick start

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

const host = document.getElementById('app')!;
const editor = new HTMLEditor(host);

await editor.setLocale('en');
editor.use(new ToolbarPlugin());
editor.use(new AlignmentPlugin());

editor.setHtml('<p>Hello</p>');
editor.on('content-change', () => {
  console.log(editor.getHtml());
});
```

## Sections

- [Core API](/v1/core) — `HTMLEditor`, events, locales
- [Plugin development](/v1/plugin-development) — class plugins
- [Plugins](/v1/plugins/) — catalog
- [Integrations](/v1/integrations/) — framework recipes

For v2 (JSON document + SDK), start at the [Editor API](/guide/editor).
