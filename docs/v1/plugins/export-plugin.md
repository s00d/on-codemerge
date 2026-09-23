# Export Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Export Plugin provides comprehensive export capabilities for the on-CodeMerge editor, allowing users to export their documents in various formats including PDF, HTML, Markdown, and more.

## Features

- **Multiple Export Formats**: PDF, HTML, Markdown, DOCX, TXT
- **Export Customization**: Customize export settings
- **Export Preview**: Preview before exporting
- **Batch Export**: Export multiple documents
- **Export Templates**: Pre-defined export templates
- **Quality Settings**: Adjust export quality
- **Page Setup**: Configure page layout
- **Export History**: Track export history
- **Export Scheduling**: Schedule exports
- **Export Notifications**: Get notified when export completes

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, ExportPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new ExportPlugin());
```

## Demo
## API Reference

### Export Methods

```javascript
// Export to PDF
editor.exportToPDF(options);

// Export to HTML
editor.exportToHTML(options);

// Export to Markdown
editor.exportToMarkdown(options);

// Export to DOCX
editor.exportToDOCX(options);

// Export to TXT
editor.exportToTXT(options);

// Get export history
const history = editor.getExportHistory();

// Get export templates
const templates = editor.getExportTemplates();
```

## Supported Export Formats

- **PDF**: Portable Document Format
- **HTML**: HyperText Markup Language
- **Markdown**: Lightweight markup language
- **DOCX**: Microsoft Word document
- **TXT**: Plain text format
- **RTF**: Rich Text Format
- **EPUB**: Electronic publication format


_…trimmed for the v1 archive. See source history for the full guide._
