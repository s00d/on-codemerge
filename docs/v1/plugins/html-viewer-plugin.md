# HTML Viewer Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The HTML Viewer Plugin provides HTML code viewing and syntax highlighting capabilities for the on-CodeMerge editor, allowing users to view and analyze HTML code with enhanced readability.

## Features

- **HTML Viewing**: View HTML code in a dedicated viewer
- **Syntax Highlighting**: Color-coded HTML syntax
- **Code Formatting**: Automatic HTML formatting and indentation
- **Line Numbers**: Line numbering for easy reference
- **Search and Replace**: Find and replace functionality
- **Copy to Clipboard**: Easy code copying
- **Theme Support**: Multiple color themes
- **Responsive Design**: Mobile-friendly viewer
- **Export Options**: Export formatted HTML code

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, HTMLViewerPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new HTMLViewerPlugin());
```

## API Reference

### Viewer Methods

```javascript
// Open HTML viewer
htmlViewerPlugin.openViewer();

// View specific HTML content
htmlViewerPlugin.viewHTML(htmlContent);

// Format HTML code
const formattedHTML = htmlViewerPlugin.formatHTML(htmlContent);

// Highlight syntax
const highlightedHTML = htmlViewerPlugin.highlightSyntax(htmlContent);

// Export formatted code
htmlViewerPlugin.exportCode(format);
```

### Viewer Configuration

```javascript
interface HTMLViewerConfig {
  theme?: 'light' | 'dark' | 'monokai' | 'github';
  showLineNumbers?: boolean;
  showLineHighlight?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  tabSize?: number;
}
```

## Events

```javascript
// Listen to viewer events
editor.on('html-viewer:opened', () => {
  console.log('HTML viewer opened');
});

editor.on('html-viewer:closed', () => {
  console.log('HTML viewer closed');
});

editor.on('html-viewer:content-changed', (content) => {
  console.log('HTML content changed:', content);
});

editor.on('html-viewer:exported', (format) => {
  console.log('HTML exported as:', format);
});
```


_…trimmed for the v1 archive. See source history for the full guide._
