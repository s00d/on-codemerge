---
sidebar_position: 17
---

# Styles

This section provides information on how to include public styles for **On-Codemerge** and lists the available styles for each plugin.

## Including Public Styles

To use the public styles provided by **On-Codemerge**, you need to import them separately in your project. Each plugin has its own CSS file that you can include as needed.

### Example of Including Styles

If you are using a module bundler like Webpack or Vite, you can import the styles directly in your JavaScript or TypeScript file:

```javascript
import 'on-codemerge/app.css'; // Core styles
import 'on-codemerge/plugins/ToolbarPlugin/public.css'; // Toolbar plugin styles
```

Alternatively, you can include the styles in your HTML file using a `<link>` tag:

```html
<link rel="stylesheet" href="path/to/on-codemerge/app.css">
<link rel="stylesheet" href="path/to/on-codemerge/plugins/ToolbarPlugin/public.css">
```

## List of Available Styles

Below is a list of all available public styles for **On-Codemerge** and its plugins:

| Plugin               | CSS File Path                                          |
|----------------------|--------------------------------------------------------|
| **Core Styles**      | `on-codemerge/app.css`                                 |
| BlockPlugin          | `on-codemerge/plugins/BlockPlugin/public.css`          |
| ChartsPlugin         | `on-codemerge/plugins/ChartsPlugin/public.css`         |
| CodeBlockPlugin      | `on-codemerge/plugins/CodeBlockPlugin/public.css`      |
| CollaborationPlugin  | `on-codemerge/plugins/CollaborationPlugin/public.css`  |
| ColorPlugin          | `on-codemerge/plugins/ColorPlugin/public.css`          |
| CommentsPlugin       | `on-codemerge/plugins/CommentsPlugin/public.css`       |
| ExportPlugin         | `on-codemerge/plugins/ExportPlugin/public.css`         |
| FileUploadPlugin     | `on-codemerge/plugins/FileUploadPlugin/public.css`     |
| FooterPlugin         | `on-codemerge/plugins/FooterPlugin/public.css`         |
| FootnotesPlugin      | `on-codemerge/plugins/FootnotesPlugin/public.css`      |
| HistoryPlugin        | `on-codemerge/plugins/HistoryPlugin/public.css`        |
| HTMLViewerPlugin     | `on-codemerge/plugins/HTMLViewerPlugin/public.css`     |
| ImagePlugin          | `on-codemerge/plugins/ImagePlugin/public.css`          |
| LinkPlugin           | `on-codemerge/plugins/LinkPlugin/public.css`           |
| ListsPlugin          | `on-codemerge/plugins/ListsPlugin/public.css`          |
| ResponsivePlugin     | `on-codemerge/plugins/ResponsivePlugin/public.css`     |
| ShortcutsPlugin      | `on-codemerge/plugins/ShortcutsPlugin/public.css`      |
| TablePlugin          | `on-codemerge/plugins/TablePlugin/public.css`          |
| TemplatesPlugin      | `on-codemerge/plugins/TemplatesPlugin/public.css`      |
| ToolbarDividerPlugin | `on-codemerge/plugins/ToolbarDividerPlugin/public.css` |
| ToolbarPlugin        | `on-codemerge/plugins/ToolbarPlugin/public.css`        |
| TypographyPlugin     | `on-codemerge/plugins/TypographyPlugin/public.css`     |
| VideoPlugin          | `on-codemerge/plugins/VideoPlugin/public.css`          |
| YouTubeVideoPlugin   | `on-codemerge/plugins/YouTubeVideoPlugin/public.css`   |
| AlignmentPlugin      | `on-codemerge/plugins/AlignmentPlugin/public.css`      |


## Notes

- **Core Styles**: Always include the core styles (`app.css`) to ensure the editor functions correctly.
- **Plugin Styles**: Include the styles for the plugins you are using to ensure proper rendering and functionality.
- **Customization**: You can override the default styles by adding your own CSS rules after importing the public styles.

By following this guide, you can ensure that **On-Codemerge** and its plugins are styled correctly in your project.