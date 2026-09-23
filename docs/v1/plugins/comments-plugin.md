# Comments Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Comments Plugin provides comprehensive commenting functionality for the on-CodeMerge editor, allowing users to add, edit, and manage comments on selected text with visual markers and tooltips.

## Features

- **Text Comments**: Add comments to selected text
- **Visual Markers**: Comment markers with hover tooltips
- **Comment Management**: Create, edit, and delete comments
- **Toolbar Integration**: Easy access via toolbar button
- **Keyboard Shortcuts**: Quick comment insertion
- **Error Handling**: User-friendly error messages
- **Comment Persistence**: Comments are stored and managed
- **Interactive UI**: Click to edit, hover to preview
- **Timestamp Tracking**: Creation and update timestamps

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, CommentsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new CommentsPlugin());
```

## API Reference

### Comment Management

```javascript
// Add comment to selected text
editor.executeCommand('comment');

// Get all comments
const comments = commentManager.getAllComments();

// Get specific comment
const comment = commentManager.getComment(commentId);

// Update comment
commentManager.updateComment(commentId, newContent);

// Delete comment
commentManager.deleteComment(commentId);
```

### Comment Interface

```typescript
interface Comment {
  id: string;           // Unique comment identifier
  content: string;      // Comment text content
  createdAt: number;    // Creation timestamp
  updatedAt: number;    // Last update timestamp
}
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+M` | Insert comment | `comment` |


_…trimmed for the v1 archive. See source history for the full guide._
