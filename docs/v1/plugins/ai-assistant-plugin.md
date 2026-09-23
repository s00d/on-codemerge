# AI Assistant Plugin

> Archive: on-codemerge **v1** (`HTMLEditor`, `editor.use(new …Plugin())`). Current: [Plugins](/plugins/) · [Migrate](/guide/migration-v1-to-v2).


AI assist actions via configured driver (Ollama / HF / …).

## Usage

```js
import { HTMLEditor, AIAssistantPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new AIAssistantPlugin());
```

Import editor CSS once at app level (`on-codemerge/index.css`, `on-codemerge/public.css`).
