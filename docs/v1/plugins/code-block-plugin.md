# Code Block Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
