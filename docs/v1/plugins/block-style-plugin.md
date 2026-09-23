# Block Style Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Block Style Plugin provides comprehensive styling capabilities for block elements in the on-CodeMerge editor, allowing users to apply custom CSS styles and classes to selected elements.

## Features

- **Block Element Detection**: Automatic detection of block-level elements
- **Style Editor**: Visual interface for applying CSS styles
- **Class Management**: Add and remove CSS classes
- **Property Selection**: Choose from predefined CSS properties
- **Value Selection**: Select from predefined values for each property
- **Real-time Preview**: See style changes immediately
- **Toolbar Integration**: Easy access via toolbar button
- **Active State**: Visual feedback when block is selected

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, BlockStylePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new BlockStylePlugin());
```

## API Reference

### Block Detection

```javascript
// Check if element is a block element
const isBlock = blockStylePlugin.isBlockElement(element);

// Get selected block element
const selectedBlock = blockStylePlugin.getSelectedElement();

// Check if block is currently selected
const hasBlockSelected = blockStylePlugin.hasBlockSelected();
```

### Style Management

```javascript
// Apply styles to selected block
blockStylePlugin.applyStyles(styles);

// Add CSS class to block
blockStylePlugin.addClass(className);

// Remove CSS class from block
blockStylePlugin.removeClass(className);

// Get current styles of block
const currentStyles = blockStylePlugin.getCurrentStyles();
```


_…trimmed for the v1 archive. See source history for the full guide._
