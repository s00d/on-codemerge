# React

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the React-specific documentation for **On-Codemerge**, a flexible web editor designed for smooth integration into React applications.

## Getting Started with React

To incorporate On-Codemerge into your React project, install the package:

```bash
npm install on-codemerge
```

## React Integration Example

Here's how to integrate On-Codemerge into a React project:

```tsx title="MyEditorComponent.tsx"
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

interface MyEditorComponentProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

const MyEditorComponent: React.FC<MyEditorComponentProps> = ({ 
  value, 
  onValueChange 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<HTMLEditor | null>(null);

  useEffect(() => {
    if (editorRef.current && !editor) {
      const newEditor = new HTMLEditor(editorRef.current);

      // Set locale
      newEditor.setLocale('ru');

      // Register plugins
      newEditor.use(new ToolbarPlugin());
      newEditor.use(new AlignmentPlugin());

      // Subscribe to content changes
      newEditor.subscribeToContentChange((newContent) => {
        console.log('Content changed:', newContent);
        if (onValueChange) {
          onValueChange(newContent);
        }
      });

      setEditor(newEditor);
    }
  }, [editor, onValueChange]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== undefined) {
      editor.setHtml(value);
    }
  }, [editor, value]);

  return <div ref={editorRef} style={{ minHeight: '300px' }}></div>;
};

export default MyEditorComponent;
```


_…trimmed for the v1 archive. See source history for the full guide._
