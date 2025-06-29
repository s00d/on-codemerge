# Code Block Plugin

The Code Block Plugin provides syntax highlighting and code block management for the on-CodeMerge editor, supporting 30+ programming languages with advanced features.

## Features

- **Syntax Highlighting**: Support for 30+ programming languages
- **Code Block Management**: Insert, edit, and delete code blocks
- **Copy to Clipboard**: One-click code copying functionality
- **Language Selection**: Choose from supported programming languages
- **Context Menu**: Right-click for quick code block operations
- **Modal Editor**: Full-screen code editing experience
- **Unique IDs**: Automatic generation of unique block identifiers
- **Content Editable**: Direct editing of code within blocks

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, CodeBlockPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CodeBlockPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['CodeBlockPlugin']" />

## API Reference

### Code Block Creation

```javascript
// Insert code block programmatically
editor.executeCommand('code-block');

// Create code block with specific content
const codeBlock = createCodeBlock('console.log("Hello World");', 'javascript');
```

### Code Block Operations

```javascript
// Edit existing code block
editor.executeCommand('editCodeBlock', {
  block: codeBlockElement,
  code: 'new code content',
  language: 'typescript'
});

// Copy code to clipboard
editor.executeCommand('copyCodeBlock', {
  block: codeBlockElement
});
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+Q` | Insert code block | `code-block` |

## Supported Programming Languages

### Web Development
- **JavaScript** (`javascript`)
- **TypeScript** (`typescript`)
- **HTML** (`html`)
- **CSS** (`css`)

### Systems Programming
- **Rust** (`rust`)
- **C++** (`cpp`, `c++`)

### General Purpose
- **Python** (`python`)
- **Java** (`java`)
- **C#** (`csharp`, `c#`)
- **Go** (`go`)
- **Ruby** (`ruby`)
- **PHP** (`php`)

### Mobile Development
- **Swift** (`swift`)
- **Kotlin** (`kotlin`)
- **Dart** (`dart`)

### JVM Languages
- **Scala** (`scala`)

### Shell Scripting
- **Shell** (`shell`, `bash`, `zsh`)

### Data & Configuration
- **JSON** (`json`)
- **YAML** (`yaml`, `yml`)
- **SQL** (`sql`)

### Documentation
- **Markdown** (`markdown`)

### Scientific Computing
- **R** (`r`)
- **MATLAB** (`matlab`)
- **Julia** (`julia`)

### Functional Programming
- **Haskell** (`haskell`)
- **Elixir** (`elixir`)
- **Erlang** (`erlang`)
- **Clojure** (`clojure`)

### Fallback
- **Plaintext** (`plaintext`) - Default for unsupported languages

## Context Menu

Right-click on a code block to access:

### Code Block Operations
- **Edit Code Block**: Open modal editor for code editing
- **Copy Code**: Copy code to clipboard
- **Delete Code Block**: Remove the code block

### Language Operations
- **Change Language**: Select different programming language
- **Language Info**: View language details

## Code Block Structure

### HTML Structure
```html
<div class="code-block" id="code-block-abc123">
  <div class="code-header">
    <span class="code-language">javascript</span>
    <button class="copy-button" onclick="...">Copy</button>
  </div>
  <pre>
    <code class="language-javascript" contenteditable="true">
      console.log("Hello World");
    </code>
  </pre>
</div>
```

### CSS Classes
- `.code-block`: Main container
- `.code-header`: Header with language and copy button
- `.code-language`: Language display
- `.copy-button`: Copy to clipboard button
- `.language-{lang}`: Syntax highlighting class

## Events

```javascript
// Listen to code block events
editor.on('code-block:created', (block) => {
  console.log('Code block created:', block);
});

editor.on('code-block:edited', (block) => {
  console.log('Code block edited:', block);
});

editor.on('code-block:deleted', (block) => {
  console.log('Code block deleted:', block);
});

editor.on('code-block:copied', (block) => {
  console.log('Code copied:', block);
});
```

## Examples

### Basic JavaScript Code Block

```html
<div class="code-block" id="code-block-abc123">
  <div class="code-header">
    <span class="code-language">javascript</span>
    <button class="copy-button">Copy</button>
  </div>
  <pre>
    <code class="language-javascript" contenteditable="true">
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
    </code>
  </pre>
</div>
```

### Python Code Block

```html
<div class="code-block" id="code-block-def456">
  <div class="code-header">
    <span class="code-language">python</span>
    <button class="copy-button">Copy</button>
  </div>
  <pre>
    <code class="language-python" contenteditable="true">
# Code Block Plugin

The Code Block Plugin provides syntax highlighting and code block management for the on-CodeMerge editor, supporting 30+ programming languages with advanced features.

## Features

- **Syntax Highlighting**: Support for 30+ programming languages
- **Code Block Management**: Insert, edit, and delete code blocks
- **Copy to Clipboard**: One-click code copying functionality
- **Language Selection**: Choose from supported programming languages
- **Context Menu**: Right-click for quick code block operations
- **Modal Editor**: Full-screen code editing experience
- **Unique IDs**: Automatic generation of unique block identifiers
- **Content Editable**: Direct editing of code within blocks

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, CodeBlockPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CodeBlockPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['CodeBlockPlugin']" />

## API Reference

### Code Block Creation

```javascript
// Insert code block programmatically
editor.executeCommand('code-block');

// Create code block with specific content
const codeBlock = createCodeBlock('console.log("Hello World");', 'javascript');
```

### Code Block Operations

```javascript
// Edit existing code block
editor.executeCommand('editCodeBlock', {
  block: codeBlockElement,
  code: 'new code content',
  language: 'typescript'
});

// Copy code to clipboard
editor.executeCommand('copyCodeBlock', {
  block: codeBlockElement
});
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+C` | Insert code block | `code-block` |

## Supported Programming Languages

### Web Development
- **JavaScript** (`javascript`)
- **TypeScript** (`typescript`)
- **HTML** (`html`)
- **CSS** (`css`)

### Systems Programming
- **Rust** (`rust`)
- **C++** (`cpp`, `c++`)

### General Purpose
- **Python** (`python`)
- **Java** (`java`)
- **C#** (`csharp`, `c#`)
- **Go** (`go`)
- **Ruby** (`ruby`)
- **PHP** (`php`)

### Mobile Development
- **Swift** (`swift`)
- **Kotlin** (`kotlin`)
- **Dart** (`dart`)

### JVM Languages
- **Scala** (`scala`)

### Shell Scripting
- **Shell** (`shell`, `bash`, `zsh`)

### Data & Configuration
- **JSON** (`json`)
- **YAML** (`yaml`, `yml`)
- **SQL** (`sql`)

### Documentation
- **Markdown** (`markdown`)

### Scientific Computing
- **R** (`r`)
- **MATLAB** (`matlab`)
- **Julia** (`julia`)

### Functional Programming
- **Haskell** (`haskell`)
- **Elixir** (`elixir`)
- **Erlang** (`erlang`)
- **Clojure** (`clojure`)

### Fallback
- **Plaintext** (`plaintext`) - Default for unsupported languages

## Context Menu

Right-click on a code block to access:

### Code Block Operations
- **Edit Code Block**: Open modal editor for code editing
- **Copy Code**: Copy code to clipboard
- **Delete Code Block**: Remove the code block

### Language Operations
- **Change Language**: Select different programming language
- **Language Info**: View language details

## Code Block Structure

### HTML Structure
```html
<div class="code-block" id="code-block-abc123">
  <div class="code-header">
    <span class="code-language">javascript</span>
    <button class="copy-button" onclick="...">Copy</button>
  </div>
  <pre>
    <code class="language-javascript" contenteditable="true">
      console.log("Hello World");
    </code>
  </pre>
</div>
```

### CSS Classes
- `.code-block`: Main container
- `.code-header`: Header with language and copy button
- `.code-language`: Language display
- `.copy-button`: Copy to clipboard button
- `.language-{lang}`: Syntax highlighting class

## Events

```javascript
// Listen to code block events
editor.on('code-block:created', (block) => {
  console.log('Code block created:', block);
});

editor.on('code-block:edited', (block) => {
  console.log('Code block edited:', block);
});

editor.on('code-block:deleted', (block) => {
  console.log('Code block deleted:', block);
});

editor.on('code-block:copied', (block) => {
  console.log('Code copied:', block);
});
```

## Examples

### Basic JavaScript Code Block

```html
<div class="code-block" id="code-block-abc123">
  <div class="code-header">
    <span class="code-language">javascript</span>
    <button class="copy-button">Copy</button>
  </div>
  <pre>
    <code class="language-javascript" contenteditable="true">
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
    </code>
  </pre>
</div>
```

### Python Code Block

```html
<div class="code-block" id="code-block-def456">
  <div class="code-header">
    <span class="code-language">python</span>
    <button class="copy-button">Copy</button>
  </div>
  <pre>
    <code class="language-python" contenteditable="true">
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
    </code>
  </pre>
</div>
```

### SQL Code Block

```html
<div class="code-block" id="code-block-ghi789">
  <div class="code-header">
    <span class="code-language">sql</span>
    <button class="copy-button">Copy</button>
  </div>
  <pre>
    <code class="language-sql" contenteditable="true">
SELECT 
  users.name,
  COUNT(orders.id) as order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id, users.name
HAVING order_count > 0
ORDER BY order_count DESC;
    </code>
  </pre>
</div>
```

## Syntax Highlighting

The plugin uses a custom syntax highlighter that supports:

### Token Types
- **Keywords**: Language-specific keywords
- **Strings**: String literals
- **Comments**: Single-line and multi-line comments
- **Numbers**: Numeric literals
- **Operators**: Mathematical and logical operators
- **Functions**: Function names and calls
- **Variables**: Variable declarations and usage

### Customization
```javascript
// Custom syntax highlighting rules
const customLanguage = {
  name: 'custom',
  patterns: {
    keywords: /\b(if|else|while|for)\b/g,
    strings: /"[^"]*"/g,
    comments: /\/\/.*$/gm
  },
  keywords: ['if', 'else', 'while', 'for']
};
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, CodeBlockPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new CodeBlockPlugin());
    }

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
      }
    };
  }, []);

  return <div ref={editorRef} className="editor-container" />;
}
```

### Vue Integration

```vue
<template>
  <div ref="editorContainer" class="editor-container"></div>
</template>

<script>
import { HTMLEditor, CodeBlockPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new CodeBlockPlugin());
  },
  beforeDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
};
</script>
```

## Styling

### Default Styles

```css
.code-block {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin: 1rem 0;
  overflow: hidden;
}

.code-header {
  background-color: #f8f9fa;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.code-language {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.copy-button {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.code-block pre {
  margin: 0;
  padding: 1rem;
  background-color: #1f2937;
  color: #f9fafb;
  overflow-x: auto;
}

.code-block code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}
```

### Custom Themes

```css
/* Dark theme */
.code-block.dark-theme pre {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

/* Light theme */
.code-block.light-theme pre {
  background-color: #f8f9fa;
  color: #212529;
}

/* Custom language colors */
.language-javascript .keyword { color: #ff6b6b; }
.language-python .keyword { color: #4ecdc4; }
.language-sql .keyword { color: #45b7d1; }
```

## Troubleshooting

### Common Issues

1. **Syntax highlighting not working**
   - Check if language is supported
   - Verify language definition exists
   - Check browser console for errors

2. **Copy button not working**
   - Ensure clipboard API is available
   - Check for HTTPS requirement
   - Verify button onclick handler

3. **Code block not editable**
   - Check if `contenteditable="true"` is set
   - Verify no conflicting event handlers
   - Ensure proper focus management

4. **Modal not opening**
   - Check if modal component is initialized
   - Verify event handlers are attached
   - Check for JavaScript errors

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Code Block plugin initialized');

// Check language support
console.log('Supported languages:', getSupportedLanguages());

// Check syntax highlighting
editor.on('code-block:created', (block) => {
  console.log('Code block created:', block);
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Syntax highlighting is applied on-demand
- Large code blocks may affect performance
- Consider lazy loading for extensive code
- Tokenization is optimized for common patterns

## Accessibility

- Screen reader support for code content
- Keyboard navigation for code blocks
- High contrast themes available
- Proper ARIA labels for buttons

## License

MIT License - see LICENSE file for details. 
