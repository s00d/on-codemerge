# Language Plugin

The Language Plugin provides interface language management for the on-CodeMerge editor, allowing users to switch UI languages and manage translations dynamically.

## Features

- **Language Switching**: Change the editor interface language on the fly
- **Translation Management**: Add, edit, and manage translations
- **Locale Detection**: Automatic detection of browser language
- **Toolbar Integration**: Language selection menu in the toolbar
- **Hotkey Support**: Quick language switching
- **Async Loading**: Load language files dynamically
- **Fallbacks**: Fallback to default language if translation is missing

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, LanguagePlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new LanguagePlugin());
```

## Demo
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['LanguagePlugin']" />

## API Reference

### Language Methods

```javascript
// Set language
editor.setLanguage('fr');

// Get current language
const lang = editor.getLanguage();

// Add new translation
editor.addTranslation('fr', { 'Insert Table': 'Insérer un tableau' });

// List available languages
const languages = editor.getAvailableLanguages();
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Alt+L` | Open language menu | `language-menu` |

## Events

```javascript
// Listen to language events
editor.on('language:changed', (lang) => {
  console.log('Language changed:', lang);
});

editor.on('language:loaded', (lang) => {
  console.log('Language loaded:', lang);
});
```

## Examples

### Basic Language Switching

```javascript
// Switch to Spanish
editor.setLanguage('es');

// Add custom translation
editor.addTranslation('es', { 'Bold': 'Negrita' });
```

### Dynamic Language Loading

```javascript
// Load language file dynamically
fetch('/locales/de.json')
  .then(res => res.json())
  .then(data => editor.addTranslation('de', data));
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, LanguagePlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new LanguagePlugin());
      editorInstance.current.on('language:changed', setLang);
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
    };
  }, []);

  return <div ref={editorRef} className="editor-container" />;
}
```

### Vue Integration

```vue
<template>
  <div>
    <div>Current language: {{ lang }}</div>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, LanguagePlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, lang: 'en' }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new LanguagePlugin());
    this.editor.on('language:changed', lang => { this.lang = lang; });
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.language-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 20px;
  min-width: 200px;
}
.language-menu-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}
.language-menu-item:hover {
  background: #f3f4f6;
}
.language-menu-item.active {
  background: #3b82f6;
  color: white;
}
```

## Troubleshooting

1. **Language not switching**
   - Check if language code is correct
   - Verify translation files are loaded
   - Check for JavaScript errors
2. **Missing translations**
   - Add fallback translations
   - Check translation keys
   - Ensure correct locale file structure

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details. 
