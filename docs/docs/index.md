---
sidebar_position: 1
---

# Introduction

Welcome to the documentation for **On-Codemerge**, a versatile web editor designed for seamless integration and functionality.

<script setup>
import EditorComponent from '../components/EditorComponent.vue';
</script>

<EditorComponent />

## Getting Started

Start by installing **On-Codemerge** in your project.


### Installation

To install `on-codemerge`, run one of the following commands in your project directory, depending on your preferred package manager:

#### Using npm
```bash
npm install --save on-codemerge
```

#### Using yarn
```bash
yarn add on-codemerge
```

#### Using pnpm
```bash
pnpm add on-codemerge
```

#### Using bun
```bash
bun add on-codemerge
```

## Integration Example

Here's a basic example of integrating On-Codemerge into a vanilla JavaScript project:

```typescript
import 'on-codemerge/index.css'
import {HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  if (appElement) {
    const editor = new HTMLEditor(editorElement);

    await editor.setLocale('ru');


    editor.use(new ToolbarPlugin());
    editor.use(new AlignmentPlugin());
    // ... register other modules

    editor.subscribeToContentChange((newContent?: string) => {
      console.log(newContent)
    });

    // Optional: Set initial content
    editor.setHtml('Your initial content here');
    console.log(editor.getHtml());
  }
});
```

Each plugin adds unique functionality to the On-Codemerge editor, making it a powerful tool for web content creation and editing.



Добавим таблицу с описанием всех плагинов в документацию. Таблица будет содержать название плагина и его краткое описание. Вот обновленный раздел документации:

---

## Available Plugins

Below is a list of all available plugins for **On-Codemerge** and their functionalities:

| Plugin                   | Description                                                             |
|--------------------------|-------------------------------------------------------------------------|
| **ToolbarPlugin**        | Adds a customizable toolbar for quick access to editor features.        |
| **AlignmentPlugin**      | Allows alignment of text (left, center, right, justify).                |
| **ToolbarDividerPlugin** | Adds a visual divider in the toolbar for better organization.           |
| **FontPlugin**           | Provides options to change font family, size, and style.                |
| **TablePlugin**          | Enables creation and editing of tables.                                 |
| **ImagePlugin**          | Allows inserting and managing images in the editor.                     |
| **BlockPlugin**          | Adds support for block-level elements like paragraphs, headings, etc.   |
| **HTMLViewerPlugin**     | Displays the raw HTML content of the editor.                            |
| **CodeBlockPlugin**      | Adds syntax-highlighted code blocks for programming languages.          |
| **TemplatesPlugin**      | Provides pre-designed templates for quick content creation.             |
| **ExportPlugin**         | Enables exporting editor content to various formats (e.g., HTML, PDF).  |
| **HistoryPlugin**        | Adds undo/redo functionality for tracking changes.                      |
| **ChartsPlugin**         | Allows embedding and editing charts in the editor.                      |
| **ShortcutsPlugin**      | Adds keyboard shortcuts for faster editing.                             |
| **ColorPlugin**          | Provides options to change text and background colors.                  |
| **TypographyPlugin**     | Adds advanced typography options like line height, letter spacing, etc. |
| **ListsPlugin**          | Enables creation of ordered and unordered lists.                        |
| **CommentsPlugin**       | Adds support for comments and annotations in the editor.                |
| **FootnotesPlugin**      | Allows adding footnotes to the content.                                 |
| **FooterPlugin**         | Adds a footer section to the editor.                                    |
| **ResponsivePlugin**     | Ensures the editor content is responsive across devices.                |
| **LinkPlugin**           | Allows inserting and managing hyperlinks.                               |
| **VideoPlugin**          | Enables embedding and managing video files.                             |
| **YouTubeVideoPlugin**   | Allows embedding YouTube videos directly into the editor.               |
| **FileUploadPlugin**     | Provides functionality to upload and manage files.                      |


Добавим таблицу с параметрами для `FileUploadPlugin` и `VideoPlugin`, чтобы пользователи могли лучше понять, как их настраивать. Вот обновленный раздел документации:

---

На основе предоставленных типов (`UploadEndpoints`, `UploadConfig`, и `defaultConfig`) обновим таблицу с параметрами для `FileUploadPlugin`. Это поможет пользователям лучше понять, как настраивать плагин.

---

## Plugin Configuration

### FileUploadPlugin Parameters

| Parameter        | Type              | Default Value             | Description                                                             |
|------------------|-------------------|---------------------------|-------------------------------------------------------------------------|
| **endpoints**    | `UploadEndpoints` | `undefined`               | Optional endpoints for file upload and download. Includes:              |
|                  | - `upload`        | `string`                  | Endpoint for uploading files.                                           |
|                  | - `download`      | `string`                  | Endpoint for downloading files.                                         |
| **maxFileSize**  | `number`          | `10 * 1024 * 1024` (10MB) | Maximum allowed file size in bytes.                                     |
| **allowedTypes** | `string[]`        | `['*/*']`                 | Array of MIME types or wildcards (`*/*`) to specify allowed file types. |
| **useEmulation** | `boolean`         | `true`                    | Enables file upload emulation for testing purposes.                     |

---

### Example:

```javascript
editor.use(
  new FileUploadPlugin({
    endpoints: {
      upload: '/api/upload',
      download: '/api/download',
    },
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    useEmulation: false,
  })
);
```
