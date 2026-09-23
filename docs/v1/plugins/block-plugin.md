# Block Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Block Plugin provides modular content block management for the on-CodeMerge editor, allowing users to create, edit, and organize content in structured blocks with different types and behaviors.

## Features

- **Block Types**: Text blocks, container blocks, and custom block types
- **Block Management**: Create, delete, duplicate, merge, and split blocks
- **Keyboard Navigation**: Tab navigation between blocks, Enter to create new blocks
- **Block Resizing**: Interactive resizing for text blocks
- **Context Menu**: Right-click for block operations
- **Auto-merge**: Automatic merging of empty adjacent blocks
- **Block Focus**: Visual feedback for active blocks
- **Content Editing**: Rich text editing within blocks

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, BlockPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new BlockPlugin());
```

## API Reference

### Block Creation

```javascript
// Insert basic block
editor.executeCommand('block');

// Insert text block
editor.executeCommand('block-text');

// Insert container block
editor.executeCommand('block-container');
```

### Block Operations

```javascript
// Delete block
editor.executeCommand('deleteBlock', { block: blockElement });

// Duplicate block
editor.executeCommand('duplicateBlock', { block: blockElement });

// Merge blocks
editor.executeCommand('mergeBlocks', { blocks: [block1, block2] });

// Split block
editor.executeCommand('splitBlock', { 
  block: blockElement, 
  position: 'middle' 
});
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+B` | Insert block | `block` |
| `Ctrl+Alt+T` | Insert text block | `block-text` |
| `Ctrl+Alt+C` | Insert container block | `block-container` |
| `Enter` | Create new block after current | Auto-creation |
| `Tab` | Navigate to next block | Navigation |
| `Shift+Tab` | Navigate to previous block | Navigation |
| `Backspace` | Merge with previous block (if empty) | Auto-merge |
| `Delete` | Merge with next block (if empty) | Auto-merge |


_…trimmed for the v1 archive. See source history for the full guide._
