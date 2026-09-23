# File Upload Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


Attach downloadable files into the document.

## Usage

```js
import { HTMLEditor, FileUploadPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FileUploadPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
