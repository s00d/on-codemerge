---
sidebar_position: 4
---

# React

Welcome to the React-specific documentation for **On-Codemerge**, a flexible web editor designed for smooth integration into React applications.

## Getting Started with React

To incorporate On-Codemerge into your React project, install the package:

```bash
npm i --save on-codemerge
```

## React Integration Example

Here’s how to integrate On-Codemerge into a React project:

```jsx title="MyEditorComponent.jsx"
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

const MyEditorComponent = ({ value, onValueChange }) => {
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    if (editorRef.current && !editor) {
      const newEditor = new HTMLEditor(editorRef.current);

      newEditor.setLocale('ru');

      newEditor.use(new ToolbarPlugin());
      newEditor.use(new AlignmentPlugin());

      newEditor.subscribeToContentChange((newContent) => {
        console.log('Content changed:', newContent);
        if (onValueChange) {
          onValueChange(newContent);
        }
      });

      setEditor(newEditor);
    }

    if (editor && value) {
      editor.setHtml(value);
    }
  }, [editor, value]);

  return <div ref={editorRef}></div>;
};

export default MyEditorComponent;
```
