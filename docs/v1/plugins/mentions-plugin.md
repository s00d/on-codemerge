> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).

## Mentions Plugin

User mentions triggered by `@`.


### Installation

```bash
npm install on-codemerge
```

### Basic Usage

```javascript
import { HTMLEditor, MentionsPlugin } from 'on-codemerge';

const editor = new HTMLEditор(container);
editor.use(new MentionsPlugin());
```

### Demo

