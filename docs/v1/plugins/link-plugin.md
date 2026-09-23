# Link Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Create and edit hyperlinks.

## Usage

```js
import { HTMLEditor, LinkPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new LinkPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
