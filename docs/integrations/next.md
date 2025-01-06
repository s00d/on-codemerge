---
sidebar_position: 6
---

# Next.js

Welcome to the Next.js-specific documentation for **On-Codemerge**, a sophisticated web editor optimized for integration with Next.js.

## Getting Started with Next.js

To include On-Codemerge in your Next.js project, install the package:

```bash
npm i --save on-codemerge
```

## Next.js Integration Example

Here’s how to integrate On-Codemerge into a Next.js project:

1. **Create a React Component**:

```jsx title="components/OnCodemergeEditor.jsx"
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

const OnCodemergeEditor = () => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      const editor = new HTMLEditor(editorRef.current);

      editor.setLocale('ru');

      editor.use(new ToolbarPlugin());
      editor.use(new AlignmentPlugin());

      editor.subscribeToContentChange((newContent) => {
        console.log('Content changed:', newContent);
      });

      editor.setHtml('Initial content goes here');
      console.log(editor.getHtml());

      return () => editor.destroy();
    }
  }, []);

  return <div ref={editorRef}></div>;
};

export default OnCodemergeEditor;
```

2. **Dynamic Import with Next.js**:

```jsx title="pages/index.jsx"
import dynamic from 'next/dynamic';

const OnCodemergeEditor = dynamic(() => import('../components/OnCodemergeEditor'), { ssr: false });

const HomePage = () => {
  return (
    <div>
      <h1>My Next.js Page with On-Codemerge</h1>
      <OnCodemergeEditor />
    </div>
  );
};

export default HomePage;
```
