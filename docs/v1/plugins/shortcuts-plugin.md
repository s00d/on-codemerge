# Shortcuts Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Shortcuts Plugin provides customizable keyboard shortcut management for the on-CodeMerge editor, allowing users to configure, view, and use hotkeys for editor actions.

## Features

- **Custom Hotkeys**: Define and manage custom keyboard shortcuts
- **Default Shortcuts**: Predefined hotkeys for common actions
- **Shortcut Menu**: View and edit shortcuts in a dedicated menu
- **Conflict Detection**: Warn about conflicting shortcuts
- **Toolbar Integration**: Shortcut menu in the toolbar
- **Hotkey Support**: Quick access to all editor features
- **Event Hooks**: Listen to shortcut events
- **Accessibility**: Keyboard navigation for all actions

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ShortcutsPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ShortcutsPlugin());
```

## Demo
## API Reference

### Shortcut Methods

```javascript
// Add custom shortcut
editor.addShortcut('Ctrl+Shift+S', 'save-document');

// Remove shortcut
editor.removeShortcut('Ctrl+Shift+S');

// List all shortcuts
const shortcuts = editor.getShortcuts();

// Trigger shortcut programmatically
editor.triggerShortcut('Ctrl+Shift+S');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+S` | Save document | `save-document` |
| `Ctrl+Alt+M` | Insert comment | `comment` |
| `Ctrl+Alt+E` | Export document | `export` |
| ... | ... | ... |

## Events

```javascript
// Listen to shortcut events
editor.on('shortcut:triggered', (shortcut, command) => {
  console.log('Shortcut triggered:', shortcut, command);
});

editor.on('shortcut:added', (shortcut, command) => {
  console.log('Shortcut added:', shortcut, command);
});

editor.on('shortcut:removed', (shortcut) => {
  console.log('Shortcut removed:', shortcut);
});
```


_…trimmed for the v1 archive. See source history for the full guide._
