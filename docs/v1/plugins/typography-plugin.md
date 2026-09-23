# Typography Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Typography Plugin provides advanced typography controls for the on-CodeMerge editor, offering font family selection, font size management, and typography styling options.

## Features

- **Font Family Selection**: Choose from various font families
- **Font Size Control**: Adjust text size with precision
- **Typography Styles**: Apply typography presets
- **Font Weight**: Control text weight (light, normal, bold)
- **Line Height**: Adjust line spacing
- **Letter Spacing**: Control character spacing
- **Text Transform**: Uppercase, lowercase, capitalize
- **Font Color**: Text color selection
- **Typography Presets**: Pre-defined typography styles
- **Custom Fonts**: Add custom font families

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, TypographyPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new TypographyPlugin());
```

## API Reference

### Typography Methods

```javascript
// Set font family
editor.setFontFamily('Arial');

// Set font size
editor.setFontSize('16px');

// Set font weight
editor.setFontWeight('bold');

// Set line height
editor.setLineHeight('1.5');

// Set letter spacing
editor.setLetterSpacing('0.5px');

// Apply typography preset
editor.applyTypographyPreset('heading-1');

// Get current typography
const typography = editor.getTypography();
```

## Typography Presets

- **Heading 1**: Large heading style
- **Heading 2**: Medium heading style
- **Heading 3**: Small heading style
- **Body Text**: Standard body text
- **Caption**: Small caption text
- **Quote**: Blockquote style
- **Code**: Monospace code style

## Events

```javascript
// Listen to typography events
editor.on('typography:changed', (typography) => {
  console.log('Typography changed:', typography);
});

editor.on('font-family:changed', (fontFamily) => {
  console.log('Font family changed:', fontFamily);
});

editor.on('font-size:changed', (fontSize) => {
  console.log('Font size changed:', fontSize);
});
```


_…trimmed for the v1 archive. See source history for the full guide._
