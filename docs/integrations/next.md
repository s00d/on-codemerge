---
sidebar_position: 6
---

# Next.js

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

```tsx title="pages/index.tsx"
import dynamic from 'next/dynamic';
import { useState } from 'react';

const OnCodemergeEditor = dynamic(() => import('../components/OnCodemergeEditor'), { 
  ssr: false 
});

const HomePage: React.FC = () => {
  const [content, setContent] = useState('<p>Initial content</p>');

  return (
    <div className="container">
      <h1>My Next.js Page with On-Codemerge</h1>
      <OnCodemergeEditor 
        value={content} 
        onChange={setContent}
        showOutput={true}
      />
      <div className="controls">
        <button onClick={() => console.log('Saving:', content)}>
          Save Content
        </button>
        <button onClick={() => setContent('<p>New content</p>')}>
          Load New Content
        </button>
      </div>
    </div>
  );
};

export default HomePage;
```

3. **API Route for Saving Content**:

```typescript title="pages/api/save-content.ts"
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { content } = req.body;
    
    // Save content to database or file
    console.log('Saving content:', content);
    
    res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

4. **Next.js Configuration**:

```javascript title="next.config.js"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });
    return config;
  },
};

module.exports = nextConfig;
```

## Key Features

- **Next.js Integration**: Full compatibility with Next.js SSR and SSG
- **Dynamic Imports**: Proper client-side only rendering for editor
- **TypeScript Support**: Complete TypeScript support with proper type definitions
- **API Routes**: Built-in API routes for content saving
- **Plugin System**: Easy plugin registration and management
- **Localization**: Multi-language support
- **Content Management**: Simple HTML content setting and retrieval
