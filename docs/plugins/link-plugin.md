# Link Plugin

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
<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['LinkPlugin']" />

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

## Events

```javascript
// Listen to link events
editor.on('link:created', (link) => {
  console.log('Link created:', link);
});

editor.on('link:edited', (link) => {
  console.log('Link edited:', link);
});

editor.on('link:removed', (link) => {
  console.log('Link removed:', link);
});

editor.on('link:clicked', (link) => {
  console.log('Link clicked:', link);
});

editor.on('link:error', (error) => {
  console.log('Link error:', error);
});
```

## Examples

### Basic Link Usage

```javascript
// Initialize link plugin
const editor = new HTMLEditor(container);
editor.use(new LinkPlugin());

// Create a simple link
editor.createLink('https://example.com', 'Visit Example');

// Create email link
editor.createLink('mailto:user@example.com', 'Send Email');

// Create phone link
editor.createLink('tel:+1234567890', 'Call Us');
```

### Link Configuration

```javascript
// Configure link plugin
const linkPlugin = new LinkPlugin({
  autoDetect: true,
  validateLinks: true,
  openInNewTab: true,
  trackClicks: true,
  allowedProtocols: ['http', 'https', 'mailto', 'tel'],
  securityCheck: true
});

editor.use(linkPlugin);
```

### Advanced Link Usage

```javascript
// Create link with custom styling
editor.createLink('https://example.com', 'Custom Link', {
  target: '_blank',
  rel: 'noopener noreferrer',
  className: 'custom-link',
  title: 'Visit our website'
});

// Edit existing link
const linkElement = document.querySelector('a');
editor.editLink(linkElement, 'https://newurl.com', 'New Link Text');

// Remove link
editor.removeLink(linkElement);
```

## Integration Examples

### React Integration

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { HTMLEditor, LinkPlugin } from 'on-codemerge';

function MyEditor() {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (editorRef.current && !editorInstance.current) {
      editorInstance.current = new HTMLEditor(editorRef.current);
      editorInstance.current.use(new LinkPlugin());
      
      editorInstance.current.on('link:created', (link) => {
        setLinks(prev => [...prev, link]);
      });
      
      editorInstance.current.on('link:removed', (linkId) => {
        setLinks(prev => prev.filter(l => l.id !== linkId));
      });
      
      editorInstance.current.on('link:clicked', (link) => {
        console.log('Link clicked:', link.url);
      });
    }
    return () => {
      if (editorInstance.current) editorInstance.current.destroy();
    };
  }, []);

  const createSampleLink = () => {
    editorInstance.current.createLink('https://example.com', 'Sample Link');
  };

  return (
    <div>
      <div>Links: {links.length}</div>
      <button onClick={createSampleLink}>Add Sample Link</button>
      <div ref={editorRef} className="editor-container" />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <div>Links: {{ links.length }}</div>
    <button @click="createSampleLink">Add Sample Link</button>
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>
<script>
import { HTMLEditor, LinkPlugin } from 'on-codemerge';
export default {
  data() { return { editor: null, links: [] }; },
  mounted() {
    this.editor = new HTMLEditor(this.$refs.editorContainer);
    this.editor.use(new LinkPlugin());
    
    this.editor.on('link:created', link => {
      this.links.push(link);
    });
    
    this.editor.on('link:removed', linkId => {
      this.links = this.links.filter(l => l.id !== linkId);
    });
    
    this.editor.on('link:clicked', link => {
      console.log('Link clicked:', link.url);
    });
  },
  methods: {
    createSampleLink() {
      this.editor.createLink('https://example.com', 'Sample Link');
    }
  },
  beforeDestroy() { if (this.editor) this.editor.destroy(); }
};
</script>
```

## Styling

```css
.link-menu {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  min-width: 350px;
  max-height: 400px;
  overflow-y: auto;
}

.link-input-group {
  margin-bottom: 16px;
}

.link-input-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  font-size: 14px;
  display: block;
}

.link-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.link-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.link-options {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.link-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #374151;
}

.link-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
}

.link-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.link-button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.link-button:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.link-button.primary {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.link-button.primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}

.link-preview {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
}

.link-error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
}

.link-success {
  color: #059669;
  font-size: 12px;
  margin-top: 4px;
}
```

## Troubleshooting

1. **Link not creating**
   - Check URL format
   - Verify text selection
   - Check for JavaScript errors
   - Ensure proper initialization

2. **Link not working**
   - Check URL validity
   - Verify protocol support
   - Check for security restrictions
   - Ensure proper encoding

3. **Link styling issues**
   - Check CSS specificity
   - Verify theme compatibility
   - Check for conflicting styles
   - Ensure proper class names

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.
