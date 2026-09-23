# Next.js

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


Welcome to the Next.js-specific documentation for **On-Codemerge**, a sophisticated web editor optimized for integration with Next.js.

## Getting Started with Next.js

To include On-Codemerge in your Next.js project, install the package:

```bash
npm install on-codemerge
```

## Next.js Integration Example

Here's how to integrate On-Codemerge into a Next.js project:

1. **Create a React Component**:

```tsx title="components/OnCodemergeEditor.tsx"
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

interface OnCodemergeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  showOutput?: boolean;
}

const OnCodemergeEditor: React.FC<OnCodemergeEditorProps> = ({ 
  value, 
  onChange, 
  showOutput = false 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<HTMLEditor | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');

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
        setCurrentContent(newContent);
        if (onChange) {
          onChange(newContent);
        }
      });

      // Set initial content
      if (value) {
        newEditor.setHtml(value);
      } else {
        newEditor.setHtml('<p>Welcome to On-Codemerge with Next.js!</p>');
      }

      setEditor(newEditor);
      setCurrentContent(newEditor.getHtml());
    }
  }, [editor, value, onChange]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHtml()) {
      editor.setHtml(value);
    }
  }, [editor, value]);

  return (
    <div>
      <div ref={editorRef} style={{ minHeight: '300px' }}></div>
      {showOutput && (
        <div className="output">
          <h3>Current HTML:</h3>
          <pre>{currentContent}</pre>
        </div>
      )}
    </div>
  );
};

export default OnCodemergeEditor;
```

2. **Dynamic Import with Next.js**:

_…trimmed for the v1 archive. See source history for the full guide._
