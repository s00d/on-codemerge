# Alignment Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Alignment Plugin provides text alignment functionality for the on-CodeMerge editor, allowing users to align text left, center, right, or justify it with toolbar buttons and visual feedback.

## Features

- **Text Alignment**: Left, center, right, and justify alignment
- **Toolbar Integration**: Easy access via toolbar buttons
- **Visual Feedback**: Active state indication for current alignment
- **Keyboard Shortcuts**: Quick alignment commands
- **Selection Awareness**: Automatic detection of current alignment
- **Toggle Functionality**: Toggle alignment on/off
- **Real-time Updates**: Immediate visual feedback

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, AlignmentPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new AlignmentPlugin());
```

## Demo
## API Reference

### Alignment Commands

```javascript
// Align text left
editor.executeCommand('align_left');

// Align text center
editor.executeCommand('align_center');

// Align text right
editor.executeCommand('align_right');

// Justify text
editor.executeCommand('align_justify');

// Toggle alignment style
editor.getTextFormatter()?.toggleStyle('alignLeft');
editor.getTextFormatter()?.toggleStyle('alignCenter');
editor.getTextFormatter()?.toggleStyle('alignRight');
editor.getTextFormatter()?.toggleStyle('alignJustify');
```

### Alignment Detection

```javascript
// Check if alignment is applied
const isLeftAligned = editor.getTextFormatter()?.hasClass('alignLeft');
const isCenterAligned = editor.getTextFormatter()?.hasClass('alignCenter');
const isRightAligned = editor.getTextFormatter()?.hasClass('alignRight');
const isJustified = editor.getTextFormatter()?.hasClass('alignJustify');
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+B` | Bold text | `bold` |
| `Ctrl+I` | Italic text | `italic` |
| `Ctrl+U` | Underline text | `underline` |
| `Ctrl+Shift+S` | Strikethrough text | `strikethrough` |


_…trimmed for the v1 archive. See source history for the full guide._
