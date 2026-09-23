# Font Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Font Plugin provides comprehensive typography control for the on-CodeMerge editor, allowing users to change font families, sizes, line heights, and apply text formatting styles.

## Features

- **Font Family Selection**: Choose from 35+ predefined fonts
- **Font Size Control**: 65+ size options from 8px to 72px
- **Line Height Adjustment**: 12 line height options
- **Text Formatting**: Bold, italic, underline, strikethrough
- **Dynamic Font Detection**: Auto-detects loaded web fonts
- **Visual Feedback**: Active state indication for applied styles
- **Toolbar Integration**: Easy access via toolbar buttons
- **Keyboard Shortcuts**: Quick font style commands
- **Font Settings Popup**: Comprehensive font configuration

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, FontPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new FontPlugin());
```

## API Reference

### Font Methods

```javascript
// Apply font settings
editor.getTextFormatter()?.setFont(family, size, lineHeight);

// Get current font style
const fontFamily = editor.getTextFormatter()?.getStyle('fontFamily');
const fontSize = editor.getTextFormatter()?.getStyle('fontSize');
const lineHeight = editor.getTextFormatter()?.getStyle('lineHeight');

// Clear font settings
editor.getTextFormatter()?.clearFont();

// Toggle text styles
editor.getTextFormatter()?.toggleStyle('bold');
editor.getTextFormatter()?.toggleStyle('italic');
editor.getTextFormatter()?.toggleStyle('underline');
editor.getTextFormatter()?.toggleStyle('strikethrough');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+F` | Font settings | `font-style` |

## Available Fonts

### Default Font Families
- Arial, Arial Black, Verdana, Tahoma
- Trebuchet MS, Times New Roman, Georgia
- Garamond, Courier New, Brush Script MT
- Comic Sans MS, Impact, Lucida Console
- Palatino, Bookman, Avant Garde, Courier
- Helvetica, Geneva, Optima, Futura
- Baskerville, Didot, American Typewriter
- Andale Mono, Monaco, Bradley Hand
- Chalkduster, Copperplate, Papyrus
- Trattatello, Snell Roundhand, Zapfino
- Herculanum

### Font Sizes
8px to 72px in 1px increments

### Line Heights
- normal, 0.75, 1, 1.15, 1.25, 1.35
- 1.5, 1.75, 2, 2.5, 3, 16px


_…trimmed for the v1 archive. See source history for the full guide._
