# History Plugin

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

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['HistoryPlugin']" />

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

## Events

```javascript
// Listen to history events
editor.on('history:version-created', (version) => {
  console.log('New version created:', version);
});

editor.on('history:version-restored', (version) => {
  console.log('Version restored:', version);
});

editor.on('history:cleared', () => {
  console.log('History cleared');
});

editor.on('history:exported', (data) => {
  console.log('History exported:', data);
});
```

## Examples

### Basic History Usage

```javascript
// Initialize with history tracking
const editor = new HTMLEditor(container);
editor.use(new HistoryPlugin());

// Get current history
const history = historyPlugin.getHistory();
console.log('Document has', history.length, 'versions');

// Restore to previous version
if (history.length > 1) {
  const previousVersion = history[history.length - 2];
  historyPlugin.restoreVersion(previousVersion.id);
}
```

### Version Comparison

```javascript
// Compare two versions
const history = historyPlugin.getHistory();
if (history.length >= 2) {
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  
  const diff = historyPlugin.compareVersions(previous.id, latest.id);
  console.log('Changes between versions:', diff);
}
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, HistoryPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new HistoryPlugin());
      
      // Track history changes
      editorInstance.current.on('history:version-created', (version) => {
        setHistory(prev => [...prev, version]);
      });
    }

    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <div className="history-info">
        Versions: {history.length}
      </div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div class="history-panel" v-if="history.length">
      <h3>Document History</h3>
      <ul>
        <li v-for="version in history" :key="version.id">
          {{ new Date(version.timestamp).toLocaleString() }}
          <button @click="restoreVersion(version.id)">Restore</button>
        </li>
      </ul>
    </div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import { HTMLEditor, HistoryPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  data() {
    return {
      editor: null,
      history: []
    };
  },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new HistoryPlugin());
    
    this.editor.on('history:version-created', (version) => {
      this.history.push(version);
    });
  },
  methods: {
    restoreVersion(versionId) {
      this.historyPlugin.restoreVersion(versionId);
    }
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
/* History viewer */
.history-viewer {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  max-height: 600px;
  overflow: auto;
}

/* History entry */
.history-entry {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.history-entry:hover {
  background-color: #f9fafb;
}

.history-entry.selected {
  background-color: #eff6ff;
  border-left: 3px solid #3b82f6;
}

/* Version timestamp */
.version-timestamp {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

/* Version description */
.version-description {
  font-weight: 500;
  color: #374151;
}

/* Diff view */
.diff-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

.diff-panel {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 12px;
  background-color: #f9fafb;
}

/* Diff highlighting */
.diff-added {
  background-color: #dcfce7;
  color: #166534;
}

.diff-removed {
  background-color: #fee2e2;
  color: #991b1b;
  text-decoration: line-through;
}
```

## Troubleshooting

### Common Issues

1. **History not tracking**
   - Check plugin initialization
   - Verify content change detection
   - Check for JavaScript errors
   - Ensure history storage is working

2. **Version restoration failing**
   - Check version ID validity
   - Verify content format
   - Check for conflicts
   - Ensure proper state management

3. **Performance issues**
   - Check history size limits
   - Verify storage optimization
   - Check for memory leaks
   - Ensure efficient diffing

### Debug Mode

```javascript
// Add console logging
console.log('History plugin initialized');

// Check history events
editor.on('history:version-created', (version) => {
  console.log('Version created:', version);
});

// Check history state
const history = historyPlugin.getHistory();
console.log('Current history:', history);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
