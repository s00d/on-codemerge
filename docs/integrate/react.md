# React

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
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';
import { Editor, createCorePlugins, AlignmentPlugin, LanguagePlugin } from 'on-codemerge';

interface MyEditorComponentProps {
  /** JSON document string (SoT), not HTML */
  value?: string;
  onValueChange?: (value: string) => void;
}

const MyEditorComponent: React.FC<MyEditorComponentProps> = ({ value, onValueChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    if (editorRef.current && !editor) {
      const newEditor = new Editor(editorRef.current, {
        plugins: [...createCorePlugins(), AlignmentPlugin(), LanguagePlugin()],
      });

      void newEditor.setLocale('ru');

      // Callback receives EditorState — read SoT with getJSON()
      newEditor.on('docChanged', () => {
        const json = JSON.stringify(newEditor.getJSON());
        console.log('Document changed:', json);
        onValueChange?.(json);
      });

      setEditor(newEditor);
    }
  }, [editor, onValueChange]);

  // Update editor when value prop changes (JSON SoT)
  useEffect(() => {
    if (editor && value !== undefined) {
      try {
        editor.setJSON(JSON.parse(value));
      } catch {
        // optional: treat as HTML boundary
        editor.setHTML(value);
      }
    }
  }, [editor, value]);

  return <div ref={editorRef} style={{ minHeight: '300px' }}></div>;
};

export default MyEditorComponent;
```

## Usage Example

```tsx title="App.tsx"
import React, { useState } from 'react';
import MyEditorComponent from './MyEditorComponent';

const App: React.FC = () => {
  const [content, setContent] = useState(
    JSON.stringify({
      version: 1,
      doc: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initial content' }] }],
      },
    })
  );

  return (
    <div>
      <h1>My React App with On-Codemerge</h1>
      <MyEditorComponent value={content} onValueChange={setContent} />
      <div>
        <h3>Current JSON:</h3>
        <pre>{content}</pre>
      </div>
    </div>
  );
};

export default App;
```

## Key Features

- **TypeScript Support**: Full TypeScript support with proper type definitions
- **Controlled Component**: Supports controlled mode with `value` and `onValueChange` props (JSON SoT)
- **Plugin System**: Easy integration with various plugins
- **Localization**: Built-in support for multiple languages
- **Content Management**: Persist with `getJSON` / `setJSON` (HTML only as boundary)
