# WIP

#### Description

This text editor is a modular system that allows for extending functionality through plugins. The editor supports basic text editing features such as undo and redo, and it enables inserting and editing links and videos.

#### Installation

To use the editor, include it in your project by importing the main EditorCore class and any required plugins.

```javascript
import { EditorCore } from 'path/to/editorcore';
import BoldButtonPlugin from 'path/to/boldbuttonplugin';
// Import other plugins as needed
```

#### Setup

Initialize the editor by creating an instance of `EditorCore` and passing the target DOM element where the editor should be rendered.

```javascript
const targetElement = document.getElementById('editor');
const editor = new EditorCore(targetElement);

// Register plugins
editor.registerModule(new BoldButtonPlugin());
// Register other plugins in a similar manner

// To start the editor
editor.init();
```

#### Using Plugins

Plugins can be added to enhance the functionality of the editor. Here's an example of how to add a bold button plugin.

```javascript
import BoldButtonPlugin from 'path/to/boldbuttonplugin';

// After initializing the editor
editor.registerModule(new BoldButtonPlugin());
```

#### API

The `EditorCore` class exposes several methods for managing the editor's state and content:

- `getContent()`: Returns the current content of the editor.
- `setContent(newContent: string)`: Sets the content of the editor.
- `undo()`: Undoes the last action.
- `redo()`: Redoes the last undone action.
- `subscribeToContentChange(callback: Function)`: Subscribes to content change events.

#### Customizing

You can create custom plugins by implementing the `IEditorModule` interface and registering them with the editor.

```javascript
class CustomPlugin implements IEditorModule {
  initialize(core: EditorCore): void {
    // Plugin initialization logic
  }
}

// Register the custom plugin
editor.registerModule(new CustomPlugin());
```

#### Contribution

Contributions to the editor are welcome. Please ensure that custom plugins and features adhere to the project's architecture and coding standards.

---

For more detailed documentation, please refer to the individual plugin files and the source code of `EditorCore`.
