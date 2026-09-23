# Code Block Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Fenced code blocks with language highlighting.

## Usage

```js
import { HTMLEditor, CodeBlockPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CodeBlockPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
