# Comments Plugin

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

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['CommentsPlugin']" />

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

## Comment Workflow

### Adding Comments

1. **Select Text**: Highlight the text you want to comment on
2. **Add Comment**: Click the comment button or use keyboard shortcut
3. **Enter Content**: Type your comment in the comment dialog
4. **Save**: Click save to create the comment

### Editing Comments

1. **Click Marker**: Click on the comment marker
2. **Edit Content**: Modify the comment text
3. **Save Changes**: Click save to update the comment

### Deleting Comments

1. **Click Marker**: Click on the comment marker
2. **Delete**: Click the delete button
3. **Confirm**: Comment and marker are removed

## Events

```javascript
// Listen to comment events
editor.on('comment:added', (comment) => {
  console.log('Comment added:', comment);
});

editor.on('comment:updated', (comment) => {
  console.log('Comment updated:', comment);
});

editor.on('comment:deleted', (commentId) => {
  console.log('Comment deleted:', commentId);
});

editor.on('comment:clicked', (commentId) => {
  console.log('Comment clicked:', commentId);
});
```

## Examples

### Basic Comment Usage

```html
<!-- Text with comment -->
<span class="commented-text">
  This text has a comment
</span>
<span class="comment-marker" data-comment-id="comment-123">
  💬
</span>
```

### Multiple Comments

```html
<p>
  This is a paragraph with 
  <span class="commented-text">multiple comments</span>
  <span class="comment-marker" data-comment-id="comment-1">💬</span>
  and 
  <span class="commented-text">another comment</span>
  <span class="comment-marker" data-comment-id="comment-2">💬</span>
  on different parts.
</p>
```

### Comment with Styling

```html
<div class="comment-container">
  <span class="commented-text highlighted">
    This text is highlighted and commented
  </span>
  <span class="comment-marker" data-comment-id="comment-456">
    💬
  </span>
</div>
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import { HTMLEditor, CommentsPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new CommentsPlugin());
      
      // Listen to comment events
      editorInstance.current.on('comment:added', (comment) => {
        console.log('New comment:', comment);
      });
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
  <div>
    <div class="comment-stats">
      Comments: {{ commentCount }}
    </div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
import { HTMLEditor, CommentsPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  data() {
    return {
      editor: null,
      commentCount: 0
    };
  },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new CommentsPlugin());
    
    // Track comment count
    this.editor.on('comment:added', () => {
      this.commentCount++;
    });
    
    this.editor.on('comment:deleted', () => {
      this.commentCount--;
    });
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
/* Comment marker */
.comment-marker {
  display: inline-block;
  cursor: pointer;
  color: #3b82f6;
  font-size: 14px;
  margin-left: 4px;
  transition: all 0.2s ease;
}

.comment-marker:hover {
  color: #1d4ed8;
  transform: scale(1.1);
}

/* Commented text */
.commented-text {
  background-color: #fef3c7;
  border-bottom: 2px solid #f59e0b;
  padding: 2px 4px;
  border-radius: 3px;
}

/* Comment tooltip */
.comment-tooltip {
  position: absolute;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  max-width: 300px;
  z-index: 1000;
  pointer-events: none;
}

/* Comment menu */
.comment-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  max-width: 400px;
}

.comment-input {
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}
```

### Custom Comment Themes

```css
/* Dark theme */
.comment-dark .comment-marker {
  color: #60a5fa;
}

.comment-dark .commented-text {
  background-color: #374151;
  border-bottom-color: #60a5fa;
  color: #f9fafb;
}

.comment-dark .comment-tooltip {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

/* Custom comment styles */
.comment-highlight {
  background: linear-gradient(45deg, #fef3c7, #fde68a);
  border-bottom: 2px solid #f59e0b;
}

.comment-important {
  background-color: #fee2e2;
  border-bottom: 2px solid #ef4444;
}

.comment-info {
  background-color: #dbeafe;
  border-bottom: 2px solid #3b82f6;
}
```

### Responsive Comment Styles

```css
/* Mobile comment styles */
@media (max-width: 768px) {
  .comment-tooltip {
    max-width: 250px;
    font-size: 12px;
    padding: 6px 8px;
  }
  
  .comment-menu {
    max-width: 90vw;
    margin: 0 16px;
  }
  
  .comment-marker {
    font-size: 16px;
  }
}

/* Tablet comment styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .comment-tooltip {
    max-width: 280px;
  }
}
```

## Comment Data Structure

### Comment Object

```javascript
{
  id: "comment-uuid-123",
  content: "This is a comment about the selected text",
  createdAt: 1640995200000,  // Timestamp
  updatedAt: 1640995200000   // Timestamp
}
```

### Comment Marker HTML

```html
<span class="comment-marker" data-comment-id="comment-uuid-123">
  💬
</span>
```

### Commented Text HTML

```html
<span class="commented-text">
  This text has a comment attached to it
</span>
```

## Troubleshooting

### Common Issues

1. **Comment not adding**
   - Check if text is selected before adding comment
   - Verify selection is not collapsed
   - Check for JavaScript errors
   - Ensure comment manager is initialized

2. **Comment marker not showing**
   - Check if comment was created successfully
   - Verify marker insertion logic
   - Check for CSS conflicts
   - Ensure DOM manipulation is working

3. **Tooltip not appearing**
   - Check if comment data exists
   - Verify mouse event handlers
   - Check tooltip positioning
   - Ensure tooltip element exists in DOM

4. **Comment not editing**
   - Check if comment ID is valid
   - Verify click event handlers
   - Check comment menu initialization
   - Ensure comment manager is working

### Debug Mode

Enable debug logging:

```javascript
// Add console logging
console.log('Comments plugin initialized');

// Check comment events
editor.on('comment:added', (comment) => {
  console.log('Comment added:', comment);
});

editor.on('comment:updated', (comment) => {
  console.log('Comment updated:', comment);
});

// Check comment manager
const allComments = commentManager.getAllComments();
console.log('All comments:', allComments);

// Check comment markers
const markers = document.querySelectorAll('.comment-marker');
console.log('Comment markers found:', markers.length);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Comments are stored in memory for fast access
- Tooltips are created on-demand
- Event delegation for comment markers
- Efficient DOM manipulation for comment insertion

## Accessibility

- Screen reader support for comment markers
- Keyboard navigation for comment controls
- Proper ARIA labels for comment elements
- High contrast comment indicators

## License

MIT License - see LICENSE file for details. 
