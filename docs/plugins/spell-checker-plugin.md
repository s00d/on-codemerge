# Spell Checker Plugin

The Spell Checker Plugin provides comprehensive spell checking capabilities for the on-CodeMerge editor, supporting multiple languages and offering real-time error detection and correction suggestions.

## Features

- **Multi-language Support**: Spell checking in 20+ languages
- **Real-time Checking**: Live spell error detection
- **Error Highlighting**: Visual indication of spelling errors
- **Correction Suggestions**: Context-aware word suggestions
- **Custom Dictionaries**: Add custom words and terms
- **Ignore Words**: Temporarily ignore specific words
- **Language Detection**: Automatic language detection
- **Toolbar Integration**: Spell checker menu in toolbar
- **Keyboard Shortcuts**: Quick spell check commands

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, SpellCheckerPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new SpellCheckerPlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['SpellCheckerPlugin']" />

## API Reference

### Spell Checker Methods

```javascript
// Check spelling
editor.checkSpelling();

// Set language
editor.setSpellCheckLanguage('en');

// Add word to dictionary
editor.addToDictionary('customword');

// Ignore word
editor.ignoreWord('ignoredword');

// Get suggestions
const suggestions = editor.getSuggestions('misspelledword');
```

## Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Dutch (nl)
- Swedish (sv)
- Norwegian (no)
- Danish (da)
- Finnish (fi)
- Polish (pl)
- Czech (cs)
- Hungarian (hu)
- Turkish (tr)

## Events

```javascript
// Listen to spell checker events
editor.on('spellcheck:started', () => {
  console.log('Spell check started');
});

editor.on('spellcheck:completed', (errors) => {
  console.log('Spell check completed:', errors);
});

editor.on('spellcheck:error-found', (error) => {
  console.log('Spelling error found:', error);
});
```

## Examples

### Basic Spell Checking

```javascript
// Initialize spell checker
const spellChecker = new SpellCheckerPlugin({
  language: 'en',
  autoCheck: true
});

editor.use(spellChecker);

// Check spelling manually
editor.checkSpelling();
```

### Custom Dictionary

```javascript
// Add custom words
editor.addToDictionary('on-codemerge');
editor.addToDictionary('HTMLEditor');
editor.addToDictionary('plugin');

// Ignore words
editor.ignoreWord('lorem');
editor.ignoreWord('ipsum');
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, SpellCheckerPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [spellErrors, setSpellErrors] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new SpellCheckerPlugin());
      
      editorInstance.current.on('spellcheck:completed', (errors) => {
        setSpellErrors(errors);
      });
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
    };
  }, []);

  return (
    <div>
      <div>Spell errors: {spellErrors.length}</div>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div>Spell errors: {{ spellErrors.length }}</div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, SpellCheckerPlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, spellErrors: [] }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new SpellCheckerPlugin());
    this.editor.on('spellcheck:completed', errors => {
      this.spellErrors = errors;
    });
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.spell-error {
  background-color: #fee2e2;
  border-bottom: 2px solid #ef4444;
  cursor: pointer;
}

.spell-error:hover {
  background-color: #fecaca;
}

.spell-suggestions {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  min-width: 200px;
}

.spell-suggestion {
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.spell-suggestion:hover {
  background-color: #f3f4f6;
}

.spell-ignore {
  color: #6b7280;
  font-style: italic;
}

.spell-add {
  color: #3b82f6;
  font-weight: 500;
}
```

## Troubleshooting

1. **Spell checker not working**
   - Check if language is supported
   - Verify dictionary files are loaded
   - Check for JavaScript errors
   - Ensure plugin is initialized

2. **No suggestions appearing**
   - Check if word is in dictionary
   - Verify suggestion algorithm
   - Check for network issues
   - Ensure proper word parsing

3. **Performance issues**
   - Reduce auto-check frequency
   - Limit text length for checking
   - Use worker threads for large documents
   - Optimize dictionary loading

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
