# on-codemerge

zero dependencies editor

[Docs](https://s00d.github.io/on-codemerge/)

## Description

This text editor is a modular system that allows for extending functionality through plugins. The editor supports basic text editing features such as undo and redo, and it enables inserting and editing links and videos.

## Installation

To use the editor, include it in your project by importing the main EditorCore class and any required plugins.

```javascript
import { EditorCore } from 'on-codemerge';
import BoldButtonPlugin from 'on-codemerge/boldbuttonplugin';
// Import other plugins as needed
```

## Setup

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

## Using Plugins

Plugins can be added to enhance the functionality of the editor. Here's an example of how to add a bold button plugin.

```javascript
import BoldButtonPlugin from 'path/to/boldbuttonplugin';

// After initializing the editor
editor.registerModule(new BoldButtonPlugin());
```


## Contribution

Contributions to the editor are welcome. Please ensure that custom plugins and features adhere to the project's architecture and coding standards.

---

For more detailed documentation, please refer to the individual plugin files and the source code of `EditorCore`.
