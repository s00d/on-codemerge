---
title: 'on-codemerge'
description: 'Plugin-oriented document editors on one JSON kernel: WYSIWYG, JSON, Markdown, Code, Forms, Charts, Calendar and Tables.'
---

```bash
pnpm add on-codemerge
```

```ts
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createDefaultPlugins } from 'on-codemerge';

const editor = new Editor(document.getElementById('app')!, {
  plugins: createDefaultPlugins(),
});

await editor.setLocale('en');
editor.setHTML('<p>Hello</p>');
```
