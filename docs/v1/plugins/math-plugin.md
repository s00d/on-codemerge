# Math Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).

Math formulas (TeX-like input → rendered math).

## Usage

```js
import { HTMLEditor, MathPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new MathPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
