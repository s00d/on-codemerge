# History Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The History Plugin provides comprehensive document history management for the on-CodeMerge editor, allowing users to track changes, view history, and restore previous versions.

## Features

- **Change Tracking**: Automatic tracking of all document changes
- **History Viewer**: Visual interface for browsing document history
- **Version Comparison**: Side-by-side comparison of document versions
- **Restore Points**: Restore document to any previous state
- **Change Logging**: Detailed logging of all modifications
- **Undo/Redo**: Enhanced undo and redo functionality
- **History Export**: Export change history and diffs
- **Performance Optimized**: Efficient history storage and retrieval
- **Diff Visualization**: Visual diff highlighting

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, HistoryPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new HistoryPlugin());
```

## API Reference

### History Methods

```javascript
// Get document history
const history = historyPlugin.getHistory();

// Get specific version
const version = historyPlugin.getVersion(versionId);

// Restore to version
historyPlugin.restoreVersion(versionId);

// Compare versions
const diff = historyPlugin.compareVersions(version1Id, version2Id);

// Export history
const historyData = historyPlugin.exportHistory();

// Clear history
historyPlugin.clearHistory();
```

### History Entry Interface

```javascript
interface HistoryEntry {
  id: string;           // Unique version identifier
  timestamp: number;    // Version timestamp
  content: string;      // Document content at this version
  description: string;  // Version description
  author?: string;      // Author of changes
  changes: Change[];    // List of changes made
}
```


_…trimmed for the v1 archive. See source history for the full guide._
