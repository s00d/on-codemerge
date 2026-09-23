# Math Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Math Plugin provides mathematical formula rendering and editing capabilities for the on-CodeMerge editor, supporting LaTeX syntax with interactive features.

## Features

- **LaTeX Support**: Full LaTeX mathematical notation support
- **Interactive Editing**: Click to edit mathematical formulas
- **Drag & Drop**: Move formulas around the document
- **Resizable Formulas**: Interactive resizing with handles
- **Context Menu**: Right-click for quick math operations
- **Toolbar Integration**: Easy access via toolbar button
- **Real-time Rendering**: Instant formula preview
- **Multiple Formats**: Inline and block math support

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, MathPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new MathPlugin());
```

## Demo
## API Reference

### Math Formula Creation

```javascript
// Insert math formula programmatically
editor.executeCommand('math-editor');

// Create math formula with specific LaTeX
const mathElement = createMathFormula('\\frac{a + b}{c}', {
  display: 'block',
  width: 400,
  height: 100
});
```

### Math Operations

```javascript
// Edit existing math formula
editor.executeCommand('editMath', {
  element: mathElement,
  latex: '\\int_{0}^{\\infty} e^{-x} dx'
});

// Resize math formula
editor.executeCommand('resizeMath', {
  element: mathElement,
  width: 500,
  height: 150
});
```

## Keyboard Shortcuts

| Shortcut | Description | Command |
|----------|-------------|---------|
| `Ctrl+Shift+M` | Insert math formula | `math-editor` |


_…trimmed for the v1 archive. See source history for the full guide._
