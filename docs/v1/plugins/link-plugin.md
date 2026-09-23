# Link Plugin

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


The Link Plugin provides comprehensive link management capabilities for the on-CodeMerge editor, allowing users to create, edit, and manage hyperlinks within their documents.

## Features

- **Link Creation**: Create links from selected text
- **Link Editing**: Edit existing links
- **Link Validation**: Validate link URLs
- **Link Preview**: Preview link destinations
- **Link Types**: Support for various link types (http, https, mailto, tel)
- **Link Styling**: Customize link appearance
- **Link Tracking**: Track link clicks
- **Link Security**: Security checks for links
- **Link Context Menu**: Right-click link options
- **Link Auto-detection**: Auto-detect URLs in text

## Installation

```bash
npm install on-codemerge
```

## Basic Usage

```javascript
import { HTMLEditor, LinkPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);
editor.use(new LinkPlugin());
```

## Demo
## API Reference

### Link Methods

```javascript
// Create link
editor.createLink(url, text, options);

// Edit link
editor.editLink(linkElement, newUrl, newText);

// Remove link
editor.removeLink(linkElement);

// Get link info
const linkInfo = editor.getLinkInfo(linkElement);

// Validate link
const isValid = editor.validateLink(url);

// Get all links
const links = editor.getAllLinks();

// Update link styling
editor.updateLinkStyle(linkElement, styles);
```

## Supported Link Types

- **HTTP/HTTPS**: Web URLs
- **Mailto**: Email links
- **Tel**: Phone number links
- **FTP**: File transfer links
- **File**: Local file links
- **Anchor**: Internal page links
- **JavaScript**: JavaScript links (with security)


_…trimmed for the v1 archive. See source history for the full guide._
