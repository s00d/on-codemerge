# Core Documentation

The **Core** of the application is the central part that manages the editor's functionality, plugins, localization, and other essential features. This document provides a detailed overview of the core components, their responsibilities, and how to extend the system with new plugins, locales, and more.

---

## Core Components

### HTMLEditor

The `HTMLEditor` class is the main editor instance that manages the content, plugins, and events. It provides methods for manipulating the editor's content, handling user interactions, and managing plugins.

#### Key Features:
- **Content Management**: Methods like `setHtml`, `getHtml`, and `insertTextAtCursor` allow you to manipulate the editor's content.
- **Plugin Management**: The `use` method registers plugins, which can extend the editor's functionality.
- **Event System**: The `on`, `off`, and `triggerEvent` methods allow you to handle custom events.
- **Localization**: The `t` method translates keys into the current locale, and `setLocale` changes the editor's language.

#### Example:
```typescript
const editor = new HTMLEditor(container);
editor.setHtml('<p>Hello, World!</p>');
editor.use(new ToolbarPlugin());
editor.on('content-change', (content) => console.log(content));
```

---

### Plugin System

The plugin system allows you to extend the editor's functionality. Plugins are classes that implement the `Plugin` interface, which requires an `initialize` method.

#### Plugin Interface:
```typescript
interface Plugin {
  name: string;
  initialize: (editor: HTMLEditor) => void;
  destroy?: () => void;
}
```

#### Example Plugin:
```typescript
class MyPlugin implements Plugin {
  name = 'my-plugin';

  initialize(editor: HTMLEditor) {
    console.log('MyPlugin initialized');
  }

  destroy() {
    console.log('MyPlugin destroyed');
  }
}
```

#### PluginManager:
The `PluginManager` handles the registration and lifecycle of plugins. It provides methods like `register`, `unregister`, and `destroy`.

---

### LocaleManager

The `LocaleManager` class handles localization and translation. It loads locale files and provides methods for translating keys and switching locales.

#### Key Methods:
- **`loadLocale(locale: string)`**: Loads a locale file.
- **`setLocale(locale: string)`**: Sets the current locale.
- **`translate(key: string, params?: Record<string, string>)`**: Translates a key into the current locale.

#### Example:
```typescript
const localeManager = new LocaleManager('en');
await localeManager.setLocale('ru');
console.log(localeManager.translate('New Block')); // Новый блок
```

---

### HTMLFormatter

The `HTMLFormatter` class formats HTML content for better readability. It indents tags and ensures proper line breaks.

#### Example:
```typescript
const formatter = new HTMLFormatter();
const formattedHtml = formatter.format('<div><p>Hello</p></div>');
console.log(formattedHtml);
```

---

### Command System

The `Command` interface represents an action that can be executed. Commands are used to encapsulate actions like inserting a table, deleting a row, etc.

#### Command Interface:
```typescript
interface Command {
  execute(): void;
}
```

#### Example Command:
```typescript
class InsertTableCommand implements Command {
  execute() {
    console.log('Table inserted');
  }
}
```

---

## Adding Plugins

To add a new plugin:
1. Create a class that implements the `Plugin` interface.
2. Register the plugin using the `use` method of the `HTMLEditor` instance.

#### Example:
```typescript
class MyPlugin implements Plugin {
  name = 'my-plugin';

  initialize(editor: HTMLEditor) {
    console.log('MyPlugin initialized');
  }
}

const editor = new HTMLEditor(container);
editor.use(new MyPlugin());
```

---

## Adding Locales

To add a new locale:
1. Create a JSON file in the `locales` directory (e.g., `fr.json`).
2. Add translations to the JSON file.
3. Use the `setLocale` method to switch to the new locale.

#### Example `fr.json`:
```json
{
  "New Block": "Nouveau Bloc",
  "Insert Table": "Insérer un Tableau"
}
```

#### Usage:
```typescript
await editor.setLocale('fr');
console.log(editor.t('New Block')); // Nouveau Bloc
```

---

## Event System

The event system allows you to handle custom events in the editor. Use the `on` method to subscribe to events and `triggerEvent` to fire them.

#### Example:
```typescript
editor.on('content-change', (content) => console.log(content));
editor.triggerEvent('content-change', '<p>New content</p>');
```

---

## Content Management

The editor provides methods for managing content:
- **`setHtml(html: string)`**: Sets the editor's content.
- **`getHtml(): string`**: Returns the editor's content.
- **`insertTextAtCursor(text: string)`**: Inserts text at the cursor position.

#### Example:
```typescript
editor.setHtml('<p>Hello, World!</p>');
const content = editor.getHtml();
editor.insertTextAtCursor('New text');
```

---

## Custom Commands

To create a custom command:
1. Implement the `Command` interface.
2. Execute the command using the `execute` method.

#### Example:
```typescript
class CustomCommand implements Command {
  execute() {
    console.log('Custom command executed');
  }
}

const command = new CustomCommand();
command.execute();
```

---

## Best Practices

1. **Modular Plugins**: Keep plugins small and focused on a single responsibility.
2. **Localization**: Always use the `t` method for text that needs to be translated.
3. **Event Handling**: Use the event system to decouple components and improve maintainability.
4. **Command Pattern**: Encapsulate actions in commands for better reusability and undo/redo support.
