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

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, HistoryPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [HistoryPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['HistoryPlugin']" />

## Public API (v2)

Factory: `HistoryPlugin()`.

| Command       |                                 |
| ------------- | ------------------------------- |
| `undo`        | `editor.command('undo')`        |
| `redo`        | `editor.command('redo')`        |
| `viewHistory` | `editor.command('viewHistory')` |

### Keyboard shortcuts

| Shortcut      | Command       |
| ------------- | ------------- |
| `Mod-z`       | `undo`        |
| `Mod-y`       | `redo`        |
| `Mod-Shift-z` | `redo`        |
| `Mod-Alt-h`   | `viewHistory` |

> **Note:** Use `editor.undo()` / `editor.redo()` and `viewHistory` modal. Snapshots are internal markdown — no `getHistory`/`compareVersions`/`exportHistory` on the factory return.

## Examples

### Basic History Usage

### Version Comparison

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { Editor, HistoryPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new Editor(editorRef.current);
      editorInstance.current.use(HistoryPlugin());

      // Track history changes
      editorInstance.current.on('history:version-created', (version) => {
        setHistory((prev) => [...prev, version]);
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
      <div className="history-info">Versions: {history.length}</div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

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

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.
