# Footer Plugin

The Footer Plugin automatically adds a statistics footer to the on-CodeMerge editor, displaying real-time document statistics including word count, character count, and other metrics.

## Features

- **Real-time Statistics**: Live word and character counting
- **Automatic Updates**: Statistics update as content changes
- **Document Metrics**: Words, characters, paragraphs, sentences
- **Customizable Display**: Configurable footer appearance
- **Performance Optimized**: Efficient calculation algorithms
- **Content Monitoring**: Automatic content change detection
- **Statistics Calculator**: Advanced metrics calculation
- **Footer Renderer**: Flexible footer rendering system

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, FooterPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FooterPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['FooterPlugin']" />

## API Reference

### Statistics Methods

```javascript
// Get current statistics
const stats = footerPlugin.getStatistics();

// Calculate statistics for content
const stats = statisticsCalculator.calculate(htmlContent);

// Update footer display
footerRenderer.update(stats);

// Get specific metrics
const wordCount = stats.words;
const charCount = stats.characters;
const paragraphCount = stats.paragraphs;
const sentenceCount = stats.sentences;
```

### Statistics Object

```javascript
interface DocumentStatistics {
  words: number;           // Word count
  characters: number;      // Character count (with spaces)
  charactersNoSpaces: number; // Character count (without spaces)
  paragraphs: number;      // Paragraph count
  sentences: number;       // Sentence count
  lines: number;          // Line count
  readingTime: number;    // Estimated reading time (minutes)
}
```

## Events

```javascript
// Listen to statistics updates
editor.on('statistics:updated', (stats) => {
  console.log('Statistics updated:', stats);
});

editor.on('content:changed', () => {
  console.log('Content changed, updating statistics');
});
```

## Examples

### Basic Footer Usage

```javascript
// Initialize with footer plugin
const editor = new HTMLEditor(container);
editor.use(new FooterPlugin());

// Footer will automatically appear with statistics
```

### Custom Statistics Display

```javascript
// Custom statistics calculation
const customStats = statisticsCalculator.calculate(content, {
  includeHTML: false,
  countSpaces: true,
  estimateReadingTime: true
});

// Custom footer rendering
footerRenderer.update(customStats);
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, FooterPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new FooterPlugin());
      
      // Track statistics
      editorInstance.current.on('statistics:updated', (stats) => {
        setStatistics(stats);
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
      <div ref={editorRef} className="editor-container" />
      <div className="statistics-display">
        Words: {statistics.words} | Characters: {statistics.characters}
      </div>
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div ref="editorContainer" class="editor-container"></div>
    <div class="statistics-panel">
      <span>Words: {{ stats.words }}</span>
      <span>Characters: {{ stats.characters }}</span>
      <span>Reading time: {{ stats.readingTime }} min</span>
    </div>
  </div>
</template>

<script>
import { HTMLEditor, FooterPlugin } from 'on-codemerge';

export default {
  name: 'MyEditor',
  data() {
    return {
      editor: null,
      stats: {}
    };
  },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new FooterPlugin());
    
    this.editor.on('statistics:updated', (stats) => {
      this.stats = stats;
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
/* Footer container */
.editor-footer {
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 12px 16px;
  font-size: 14px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Statistics items */
.statistics-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 16px;
}

.statistics-label {
  font-weight: 500;
  color: #374151;
}

.statistics-value {
  color: #6b7280;
  font-family: monospace;
}

/* Footer themes */
.footer-light {
  background-color: #ffffff;
  border-color: #e5e7eb;
}

.footer-dark {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}
```

## Troubleshooting

### Common Issues

1. **Statistics not updating**
   - Check content change subscription
   - Verify calculator is working
   - Check for JavaScript errors
   - Ensure footer renderer is initialized

2. **Footer not appearing**
   - Check if plugin is initialized
   - Verify container structure
   - Check for CSS conflicts
   - Ensure renderer is working

3. **Incorrect statistics**
   - Check calculation algorithm
   - Verify content parsing
   - Check for HTML tags in count
   - Ensure proper text extraction

### Debug Mode

```javascript
// Add console logging
console.log('Footer plugin initialized');

// Check statistics calculation
const content = editor.getHtml();
const stats = statisticsCalculator.calculate(content);
console.log('Calculated statistics:', stats);

// Check footer updates
editor.on('statistics:updated', (stats) => {
  console.log('Statistics updated:', stats);
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
