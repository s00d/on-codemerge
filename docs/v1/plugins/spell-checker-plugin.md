# Spell Checker Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
