# Language Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
