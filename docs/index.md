---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "OnCodemerge Docs"
  text: "A WYSIWYG editor for on-codemerge"
  actions:
    - theme: brand
      text: Docs
      link: /docs
---

A WYSIWYG editor for on-codemerge is a user-friendly interface that allows users to edit and
view their code in real time, exactly as it will appear in the final product. This intuitive
tool for developers of all skill levels.

---


# Introduction

Welcome to the documentation for **On-Codemerge**, a versatile web editor designed for seamless integration and functionality.

<script setup>
import EditorComponent from './components/EditorComponent.vue';
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
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

import {HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

document.addEventListener('DOMContentLoaded', async () => {
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

---

## Supported Locales

**On-Codemerge** supports multiple locales to cater to a global audience. Below is the list of available locales:

| Locale Code | Language             | File Name |
|-------------|----------------------|-----------|
| `ar`        | Arabic               | `ar.json` |
| `cs`        | Czech                | `cs.json` |
| `de`        | German               | `de.json` |
| `en`        | English              | `en.json` |
| `es`        | Spanish              | `es.json` |
| `fr`        | French               | `fr.json` |
| `hi`        | Hindi                | `hi.json` |
| `id`        | Indonesian           | `id.json` |
| `it`        | Italian              | `it.json` |
| `ja`        | Japanese             | `ja.json` |
| `ko`        | Korean               | `ko.json` |
| `nl`        | Dutch                | `nl.json` |
| `pl`        | Polish               | `pl.json` |
| `pt`        | Portuguese           | `pt.json` |
| `ru`        | Russian              | `ru.json` |
| `th`        | Thai                 | `th.json` |
| `tr`        | Turkish              | `tr.json` |
| `vi`        | Vietnamese           | `vi.json` |
| `zh`        | Chinese (Simplified) | `zh.json` |

---

### Setting a Locale

To set a locale in **On-Codemerge**, use the `setLocale` method:

```typescript
await editor.setLocale('ru'); // Set locale to Russian
```

---

### Translating Placeholders

You can use placeholders in your translations to dynamically insert values. For example:

```json
{
  "File size exceeds {{max}} limit": "File size exceeds {{max}} limit"
}
```

In your code, you can pass the `max` parameter when translating:

```typescript
editor.t('File size exceeds {{max}} limit', { max: '10MB' });
```

This will output: `File size exceeds 10MB limit`.

---

### Fallback Locale

If a translation key is missing in the current locale, **On-Codemerge** will fall back to the default locale (`en` by default). You can change the fallback locale using the `setFallbackLocale` method:

```typescript
editor.setFallbackLocale('en'); // Set fallback locale to English
```

---

### Getting the Current Locale

To retrieve the currently active locale, use the `getCurrentLocale` method:

```typescript
const currentLocale = editor.getCurrentLocale();
console.log(currentLocale); // Outputs: 'ru' (if Russian is set)
```

---

### Getting Loaded Locales

To get a list of all loaded locales, use the `getLoadedLocales` method:

```typescript
const loadedLocales = editor.getLoadedLocales();
console.log(loadedLocales); // Outputs: ['en', 'ru', 'es']
```

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
| **CollaborationPlugin**  | Enables real-time collaborative editing with multiple users.            |
| **FormBuilderPlugin**    | Form builder plugin                                                     |
| **SpellCheckerPlugin**   | Spell Checker plugin                                                    |
| **BlockStylePlugin**     | Class and style editor                                                  |
| **MathPlugin**           | Math Plugin                                                             |


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

# SpellCheckerPlugin

The `SpellCheckerPlugin` provides spell-checking functionality for the **On-Codemerge** editor. It relies on WebAssembly (WASM) to perform efficient spell-checking operations. To use this plugin, you need to configure your build system to handle WASM files properly.

---

## **Key Features**

- **Real-time Spell Checking**: Highlights misspelled words as you type.
- **Multi-language Support**: Works with multiple languages.
- **WASM-based**: Utilizes WebAssembly for high-performance spell checking.

---

## **Installation and Configuration**

To use the `SpellCheckerPlugin`, you need to configure your build system (e.g., Vite) to handle WASM files. Below is an example configuration for Vite:

### **Vite Configuration**

```javascript
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [
    // ...
    wasm(), // Enable WASM support
  ],
  optimizeDeps: {
    exclude: ['spellchecker-wasm'], // Exclude WASM library from dependency optimization
  },
});
```

---

## **Usage**

To use the `SpellCheckerPlugin`, follow these steps:

1. **Install the Plugin**:
   Ensure the plugin is installed in your project.

2. **Register the Plugin**:
   Register the plugin with the **On-Codemerge** editor.

3. **Configure the Plugin**:
   Provide the necessary configuration options, such as the language dictionary.

---

---

## CollaborationPlugin

The `CollaborationPlugin` enables real-time collaborative editing of documents by multiple users. It uses WebSocket to synchronize changes between clients.

---

### **Key Features**

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously.
- **Change Synchronization**: All changes are automatically synchronized between participants.
- **Version Control**: Supports content versioning to prevent conflicts.
- **Connection Status**: Displays the current connection status (e.g., "Connected", "Connection lost").

---

### **Parameters**

| Parameter     | Type      | Default Value           | Description                                                       |
|---------------|-----------|-------------------------|-------------------------------------------------------------------|
| **serverUrl** | `string`  | `'ws://localhost:8080'` | URL of the WebSocket server for change synchronization.           |
| **autoStart** | `boolean` | `true`                  | Automatically start collaboration when the plugin is initialized. |

---

---

### **Example Usage**

```typescript
import { CollaborationPlugin } from 'on-codemerge';

// Initialize the plugin
const collaborationPlugin = new CollaborationPlugin({
  serverUrl: 'ws://your-websocket-server.com',
  autoStart: true,
});

// Register the plugin with the editor
editor.use(collaborationPlugin);

// Start collaboration
collaborationPlugin.startCollaboration();

// Disconnect from the server
collaborationPlugin.disconnect();

// Reconnect to the server
collaborationPlugin.reconnect();
```

---


### **Server Integration**

To use the `CollaborationPlugin`, a WebSocket server is required to handle the following events:

1. **join**: Handles joining a document.
2. **update**: Handles sending and receiving content changes.

An example implementation of a WebSocket server is provided in the `collaboration-server` folder of the project. This example demonstrates how to set up a basic server for real-time collaboration.

---

### **Example Server**

The `collaboration-server` folder contains a Node.js implementation of a WebSocket server. Here’s how to use it:

1. Navigate to the `collaboration-server` folder:
   ```bash
   cd collaboration-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The server will run on `ws://localhost:8080` by default. You can modify the configuration as needed.

---

### **Server Features**

- **Document Management**: Tracks multiple documents and their connected clients.
- **Change Synchronization**: Broadcasts changes to all connected clients in real time.
- **Automatic Cleanup**: Removes inactive documents when all clients disconnect.

