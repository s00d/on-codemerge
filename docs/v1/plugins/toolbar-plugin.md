# Toolbar Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Toolbar Plugin provides the main toolbar functionality for the on-CodeMerge editor, offering a comprehensive set of editing tools and controls for document manipulation.

## Features

- **Rich Toolbar**: Complete set of editing tools
- **Customizable Layout**: Arrange tools as needed
- **Tool Groups**: Logical grouping of related tools
- **Responsive Design**: Adapts to different screen sizes
- **Theme Support**: Matches editor theme
- **Keyboard Shortcuts**: Quick access to tools
- **Tool Tips**: Helpful tool descriptions
- **Accessibility**: Screen reader support
- **Mobile Friendly**: Touch-optimized interface

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ToolbarPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ToolbarPlugin());
```

## Demo
## API Reference

### Toolbar Methods

```javascript
// Show/hide toolbar
editor.showToolbar();
editor.hideToolbar();

// Add custom tool
editor.addToolbarTool(tool);

// Remove tool
editor.removeToolbarTool(toolId);

// Get toolbar state
const isVisible = editor.isToolbarVisible();

// Customize toolbar
editor.setToolbarConfig(config);
```

## Tool Categories

- **Text Formatting**: Bold, italic, underline, etc.
- **Alignment**: Left, center, right, justify
- **Lists**: Bullet and numbered lists
- **Links**: Insert and edit links
- **Media**: Images, videos, files
- **Tables**: Table creation and editing
- **Code**: Code blocks and syntax highlighting
- **Special**: Special characters and symbols

## Events

```javascript
// Listen to toolbar events
editor.on('toolbar:shown', () => {
  console.log('Toolbar shown');
});

editor.on('toolbar:hidden', () => {
  console.log('Toolbar hidden');
});

editor.on('toolbar:tool-clicked', (tool) => {
  console.log('Tool clicked:', tool);
});
```


_…trimmed for the v1 archive. See source history for the full guide._
