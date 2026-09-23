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

> Install and CSS: see [Editor API — Getting Started](/guide/editor#getting-started).

## Basic Usage

```javascript
import { Editor, LinkPlugin } from 'on-codemerge';

const editor = new Editor(container, {
  plugins: [LinkPlugin()],
});
```

## Demo

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent :activePlugins="['LinkPlugin']" />

## Public API (v2)

Factory: `LinkPlugin()`.

| Command      |                                |
| ------------ | ------------------------------ |
| `insertLink` | `editor.command('insertLink')` |

### Keyboard shortcuts

| Shortcut | Command      |
| -------- | ------------ |
| `Mod-k`  | `insertLink` |

> **Note:** No factory options. Command `insertLink` — no `editor.createLink`.

## Supported Link Types

- **HTTP/HTTPS**: Web URLs
- **Mailto**: Email links
- **Tel**: Phone number links
- **FTP**: File transfer links
- **File**: Local file links
- **Anchor**: Internal page links
- **JavaScript**: JavaScript links (with security)

## Examples

### Basic Link Usage

### Link Configuration

### Advanced Link Usage

## Integration Examples

### React Integration

### Vue Integration

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

.link-option input[type='checkbox'] {
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
