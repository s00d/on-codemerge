# on-CodeMerge Plugins

on-CodeMerge provides a rich ecosystem of plugins to extend editor functionality. Each plugin can be used independently or in combination with others.

## Plugin Overview

On-Codemerge comes with a comprehensive set of plugins that extend its functionality. Each plugin adds unique features to the editor, making it a powerful tool for web content creation and editing.

## Core Plugins

### Essential Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **ToolbarPlugin** | Adds a customizable toolbar for quick access to editor features. | [View Details](./toolbar-plugin.md) |
| **ToolbarDividerPlugin** | Adds visual dividers in the toolbar for better organization. | [View Details](./toolbar-divider-plugin.md) |

### Text Formatting Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **FontPlugin** | Provides options to change font family, size, and style. | [View Details](./font-plugin.md) |
| **TypographyPlugin** | Adds advanced typography options like line height, letter spacing, etc. | [View Details](./typography-plugin.md) |
| **ColorPlugin** | Provides options to change text and background colors. | [View Details](./color-plugin.md) |
| **AlignmentPlugin** | Allows alignment of text (left, center, right, justify). | [View Details](./alignment-plugin.md) |
| **BlockStylePlugin** | Class and style editor for custom styling. | [View Details](./block-style-plugin.md) |

### Content Creation Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **BlockPlugin** | Adds support for block-level elements like paragraphs, headings, etc. | [View Details](./block-plugin.md) |
| **ListsPlugin** | Enables creation of ordered and unordered lists. | [View Details](./lists-plugin.md) |
| **TablePlugin** | Enables creation and editing of tables. | [View Details](./table-plugin.md) |
| **TemplatesPlugin** | Provides pre-designed templates for quick content creation. | [View Details](./templates-plugin.md) |

### Media Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **ImagePlugin** | Allows inserting and managing images in the editor. | [View Details](./image-plugin.md) |
| **VideoPlugin** | Enables embedding and managing video files. | [View Details](./video-plugin.md) |
| **YouTubeVideoPlugin** | Allows embedding YouTube videos directly into the editor. | [View Details](./youtube-video-plugin.md) |
| **FileUploadPlugin** | Provides functionality to upload and manage files. | [View Details](./file-upload-plugin.md) |

### Code and Technical Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **CodeBlockPlugin** | Adds syntax-highlighted code blocks for programming languages. | [View Details](./code-block-plugin.md) |
| **MathPlugin** | Enables mathematical expressions and equations. | [View Details](./math-plugin.md) |
| **HTMLViewerPlugin** | Displays the raw HTML content of the editor. | [View Details](./html-viewer-plugin.md) |

### Interactive Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **LinkPlugin** | Allows inserting and managing hyperlinks. | [View Details](./link-plugin.md) |
| **ChartsPlugin** | Allows embedding and editing charts in the editor. | [View Details](./charts-plugin.md) |
| **FormBuilderPlugin** | Form builder plugin for creating interactive forms. | [View Details](./form-builder-plugin.md) |

### Collaboration and Communication Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **CollaborationPlugin** | Enables real-time collaborative editing with multiple users. | [View Details](./collaboration-plugin.md) |
| **CommentsPlugin** | Adds support for comments and annotations in the editor. | [View Details](./comments-plugin.md) |
| **FootnotesPlugin** | Allows adding footnotes to the content. | [View Details](./footnotes-plugin.md) |

### Utility Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **HistoryPlugin** | Adds undo/redo functionality for tracking changes. | [View Details](./history-plugin.md) |
| **ExportPlugin** | Enables exporting editor content to various formats (e.g., HTML, PDF). | [View Details](./export-plugin.md) |
| **ShortcutsPlugin** | Adds keyboard shortcuts for faster editing. | [View Details](./shortcuts-plugin.md) |
| **ResponsivePlugin** | Ensures the editor content is responsive across devices. | [View Details](./responsive-plugin.md) |
| **LanguagePlugin** | Provides language switching capabilities. | [View Details](./language-plugin.md) |
| **SpellCheckerPlugin** | Provides spell-checking functionality. | [View Details](./spell-checker-plugin.md) |

### AI and Advanced Plugins

| Plugin | Description | Documentation |
|--------|-------------|---------------|
| **AIAssistantPlugin** | AI-powered assistant for content creation and editing. | [View Details](./ai-assistant-plugin.md) |
| **FooterPlugin** | Adds a footer section to the editor. | [View Details](./footer-plugin.md) |

## Plugin Configuration

### Basic Plugin Usage

```javascript
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

const editor = new HTMLEditor(container);

// Register plugins
editor.use(new ToolbarPlugin());
editor.use(new AlignmentPlugin());

// Remove plugins when no longer needed
editor.remove('toolbar'); // Removes plugin by name
editor.remove('alignment'); // Removes plugin by name

// Check available plugins
const plugins = editor.getPlugins();
console.log('Available plugins:', Array.from(plugins.keys()));
```

### Plugin Lifecycle Management

```javascript
// Dynamic plugin management
const editor = new HTMLEditor(container);

// Add plugins as needed
editor.use(new TablePlugin());
editor.use(new ImagePlugin());

// Remove specific plugins
editor.remove('table'); // Removes TablePlugin
editor.remove('image'); // Removes ImagePlugin

// Re-add plugins if needed
editor.use(new TablePlugin()); // Plugin can be re-registered
```

### Plugin Configuration Examples

```javascript
// Configure plugins with options
editor.use(new FileUploadPlugin({
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  endpoints: {
    upload: '/api/upload',
    download: '/api/download',
  }
}));

editor.use(new CollaborationPlugin({
  serverUrl: 'ws://your-websocket-server.com',
  autoStart: true,
}));

// Conditional plugin loading
if (userHasPermission('admin')) {
  editor.use(new AIAssistantPlugin());
} else {
  // Remove AI plugin if user doesn't have permission
  editor.remove('ai-assistant');
}
```

## Plugin Dependencies

Some plugins may have dependencies on other plugins. For example:

- **ToolbarPlugin** is required for most other plugins to function properly
- **BlockPlugin** is often required for content manipulation plugins
- **HistoryPlugin** is recommended for undo/redo functionality

## Plugin Management Methods

The HTMLEditor provides several methods for managing plugins:

### `editor.use(plugin)`
Registers and initializes a plugin.

```javascript
editor.use(new TablePlugin());
```

### `editor.remove(pluginName)`
Removes a plugin by name. Returns `true` if successful, `false` otherwise.

```javascript
const success = editor.remove('table');
if (success) {
    console.log('TablePlugin removed successfully');
}
```

### `editor.getPlugins()`
Returns a Map of all registered plugins.

```javascript
const plugins = editor.getPlugins();
console.log('Registered plugins:', Array.from(plugins.keys()));
```

### Plugin Cleanup

When removing plugins, the editor automatically:
- Calls the plugin's `destroy()` method if it exists
- Removes the plugin from the internal registry
- Cleans up any associated event listeners and resources

```javascript
// Example: Clean plugin removal
editor.remove('spellchecker'); // Automatically calls destroy() if available
```

## Performance Considerations

- Load only the plugins you need to minimize bundle size
- Use `editor.remove(pluginName)` to unload plugins when they're no longer needed
- Some plugins (like SpellCheckerPlugin) may require additional configuration
- CollaborationPlugin requires a WebSocket server for full functionality
- AIAssistantPlugin may require API keys for external AI services
- Removing unused plugins can help reduce memory usage and improve performance

## Browser Support

All plugins support the following browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Getting Help

If you encounter issues with any plugin:

1. Check the plugin's documentation page
2. Verify plugin dependencies are met
3. Check browser console for errors
4. Ensure proper initialization order
5. Review plugin configuration options
6. Use `editor.remove(pluginName)` to properly unload problematic plugins
7. Check if plugin has a `destroy()` method for proper cleanup
8. Verify plugin names match exactly when using `remove()` method

