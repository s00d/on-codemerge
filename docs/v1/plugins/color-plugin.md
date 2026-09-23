# Color Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Color Plugin provides comprehensive color management capabilities for the on-CodeMerge editor, including text color, background color, and a sophisticated color picker with recent colors.

## Features

- **Text Color**: Change text color with color picker
- **Background Color**: Apply background color to text
- **Color Picker**: Advanced color selection interface
- **Recent Colors**: Remember and reuse recently used colors
- **Default Colors**: Predefined color palette
- **Custom Colors**: RGB color picker for custom colors
- **Keyboard Shortcuts**: Quick access to color functions
- **Toolbar Integration**: Easy access via toolbar buttons
- **Color Persistence**: Save recent colors in localStorage

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ColorPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ColorPlugin());
```

## Demo
## API Reference

### Color Operations

```javascript
// Change text color
editor.executeCommand('fore-color');

// Change background color
editor.executeCommand('hilite-color');

// Set text color programmatically
editor.getTextFormatter()?.setColor('#FF0000');

// Set background color programmatically
editor.getTextFormatter()?.setBackgroundColor('#FFFF00');
```

### Color Picker

```javascript
// Show text color picker
colorPlugin.showTextColorPicker();

// Show background color picker
colorPlugin.showBgColorPicker();

// Get recent colors
const recentColors = JSON.parse(localStorage.getItem('html-editor-recent-colors') || '[]');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+Q` | Change text color | `fore-color` |
| `Ctrl+Shift+H` | Highlight text (background color) | `hilite-color` |


_…trimmed for the v1 archive. See source history for the full guide._
