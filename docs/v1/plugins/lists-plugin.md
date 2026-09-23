# Lists Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Lists Plugin provides comprehensive list management capabilities for the on-CodeMerge editor, supporting both ordered and unordered lists with advanced formatting and keyboard shortcuts.

## Features

- **Ordered Lists**: Numbered lists with automatic numbering
- **Unordered Lists**: Bulleted lists with custom bullet styles
- **List Toggle**: Convert between ordered and unordered lists
- **Keyboard Shortcuts**: Quick list creation and management
- **List Exit**: Exit lists with keyboard shortcuts
- **Toolbar Integration**: Easy access via toolbar buttons
- **Active State**: Visual feedback for current list type
- **Nested Lists**: Support for nested list structures
- **List Styling**: Customizable list appearance

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ListsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ListsPlugin());
```

## API Reference

### List Creation

```javascript
// Create unordered list
editor.executeCommand('lists-unordered');

// Create ordered list
editor.executeCommand('lists-ordered');

// Toggle list type
editor.executeCommand('toggleList', { type: 'ordered' });
```

### List Operations

```javascript
// Convert list type
editor.executeCommand('convertList', {
  from: 'unordered',
  to: 'ordered'
});

// Exit list
editor.executeCommand('exitList');

// Add list item
editor.executeCommand('addListItem');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+U` | Create unordered list | `lists-unordered` |
| `Ctrl+Shift+O` | Create ordered list | `lists-ordered` |
| `Ctrl+Enter` / `Cmd+Enter` | Exit list and insert break | Auto-exit |


_…trimmed for the v1 archive. See source history for the full guide._
