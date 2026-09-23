# Footnotes Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Footnotes Plugin provides comprehensive footnote management for the on-CodeMerge editor, allowing users to create, edit, and manage footnotes with automatic numbering and formatting.

## Features

- **Footnote Creation**: Add footnotes to selected text
- **Automatic Numbering**: Sequential footnote numbering
- **Footnote Editing**: Edit footnote content and references
- **Visual Markers**: Footnote markers with hover tooltips
- **Footnote List**: Organized footnote display
- **Cross-references**: Automatic reference linking
- **Toolbar Integration**: Easy access via toolbar button
- **Keyboard Shortcuts**: Quick footnote commands
- **Footnote Management**: Create, edit, delete footnotes

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, FootnotesPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FootnotesPlugin());
```

## API Reference

### Footnote Methods

```javascript
// Add footnote to selected text
editor.executeCommand('footnote');

// Get all footnotes
const footnotes = footnoteManager.getAllFootnotes();

// Get specific footnote
const footnote = footnoteManager.getFootnote(id);

// Update footnote
footnoteManager.updateFootnote(id, content);

// Delete footnote
footnoteManager.deleteFootnote(id);
```

### Footnote Interface

```javascript
interface Footnote {
  id: string;           // Unique footnote identifier
  number: number;       // Footnote number
  content: string;      // Footnote content
  reference: string;    // Reference text
  createdAt: number;    // Creation timestamp
  updatedAt: number;    // Last update timestamp
}
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+X` | Add footnote | `footnote` |


_…trimmed for the v1 archive. See source history for the full guide._
