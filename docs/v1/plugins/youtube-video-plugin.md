# YouTube Video Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


Embed YouTube videos by URL.

## Usage

```js
import { HTMLEditor, YouTubeVideoPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new YouTubeVideoPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
