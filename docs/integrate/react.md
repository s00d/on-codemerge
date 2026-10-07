# React

`CodeMergeEditor` from `@codemerge/integrate/react` (CSS auto).

## Install

```bash
npm install on-codemerge @codemerge/integrate
```

## Value + changes

```tsx
import { useState } from 'react';
import { CodeMergeEditor } from '@codemerge/integrate/react';

export function PageEditor() {
  const [html, setHtml] = useState('<p></p>');

  return <CodeMergeEditor value={html} format="html" onChange={setHtml} />;
}
```

`onChange` receives `(value, format)`. Packs / upload / locale: [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
