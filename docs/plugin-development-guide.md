---
sidebar_position: 6
---

# Plugin Development Guide

Welcome to the comprehensive **Plugin Development Guide** for **On-Codemerge**, a flexible and extensible web editor designed for seamless plugin integration. This guide covers everything you need to know to create powerful plugins that extend the editor's functionality.

## Table of Contents

- [Plugin Architecture](#plugin-architecture)
- [Basic Plugin Structure](#basic-plugin-structure)
- [Plugin Interface](#plugin-interface)
- [Core API Reference](#core-api-reference)
- [UI Components](#ui-components)
- [Event System](#event-system)
- [Command Pattern](#command-pattern)
- [Services](#services)
- [Styling](#styling)
- [Best Practices](#best-practices)
- [Advanced Features](#advanced-features)
- [Testing](#testing)
- [Examples](#examples)

## Plugin Architecture

On-Codemerge uses a modular plugin architecture where each plugin is a self-contained module that can be loaded independently. The core system provides a rich API for plugins to interact with the editor, manage UI components, handle events, and execute commands.

### Key Components

- **HTMLEditor**: The main editor instance that manages plugins and provides core functionality
- **Plugin Interface**: Standard interface that all plugins must implement
- **PluginManager**: Manages plugin registration, lifecycle, and hotkeys
- **Event System**: Pub/sub system for communication between plugins and editor
- **Command Pattern**: For executing and undoing operations
- **UI Components**: Reusable components for creating interfaces

## Basic Plugin Structure

Every plugin follows a standard structure:

```typescript
import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  hotkeys = [
    { 
      keys: 'Ctrl+Shift+M', 
      description: 'My Plugin Action', 
      command: 'my-plugin-action', 
      icon: '🔧' 
    }
  ];

  private editor: HTMLEditor | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.setupEventListeners();
    this.addToolbarButton();
  }

  destroy(): void {
    this.cleanup();
    this.editor = null;
  }

  private setupEventListeners(): void {
    // Setup event listeners
  }

  private addToolbarButton(): void {
    // Add toolbar button
  }

  private cleanup(): void {
    // Cleanup resources
  }
}
```

## Plugin Interface

The `Plugin` interface defines the contract that all plugins must follow:

```typescript
export interface Plugin {
  version?: string;
  name: string;
  hotkeys?: Hotkey[];
  initialize: (editor: HTMLEditor) => void;
  destroy?: () => void;
}

interface Hotkey {
  icon: string;
  keys: string;
  description: string;
  command: string;
}
```

### Interface Properties

- **name**: Unique identifier for the plugin
- **version**: Plugin version (optional)
- **hotkeys**: Array of keyboard shortcuts (optional)
- **initialize**: Called when plugin is registered with editor
- **destroy**: Called when plugin is removed (optional)

## Core API Reference

### HTMLEditor Methods

#### Content Management

```typescript
// Get current HTML content
const html = editor.getHtml();

// Set HTML content
await editor.setHtml('<p>New content</p>');

// Insert content at cursor
editor.insertContent('<span>Inserted text</span>');

// Insert text at cursor
editor.insertTextAtCursor('Plain text');

// Subscribe to content changes
const unsubscribe = editor.subscribeToContentChange((content) => {
  console.log('Content changed:', content);
});
```

#### Selection Management

```typescript
// Get selection container
const container = editor.getContainer();

// Get inner container
const innerContainer = editor.getInnerContainer();

// Save cursor position
const position = editor.saveCursorPosition();

// Restore cursor position
editor.restoreCursorPosition(position);

// Ensure editor has focus
editor.ensureEditorFocus();
```

#### Plugin Management

```typescript
// Register a plugin
editor.use(new MyPlugin());

// Get all plugins
const plugins = editor.getPlugins();

// Get specific plugin
const plugin = plugins.get('my-plugin');

// Get hotkeys from all plugins
const hotkeys = editor.getHotkeys();
```

#### Text Formatting

```typescript
// Get text formatter
const formatter = editor.getTextFormatter();

// Apply text styles
formatter?.toggleStyle('bold');
formatter?.toggleStyle('italic');
formatter?.toggleStyle('underline');
formatter?.toggleStyle('strikethrough');

// Check if style is applied
const isBold = formatter?.hasClass('bold');

// Apply alignment
formatter?.toggleStyle('alignLeft');
formatter?.toggleStyle('alignCenter');
formatter?.toggleStyle('alignRight');
formatter?.toggleStyle('alignJustify');
```

#### Localization

```typescript
// Set locale
await editor.setLocale('ru');

// Get current locale
const locale = editor.getLocale();

// Translate text
const translated = editor.t('key', { param: 'value' });
```

### Selector Service

The Selector service provides advanced selection and range management:

```typescript
// Get selector instance
const selector = editor.getSelector();

// Save current selection
selector?.saveSelection();

// Restore saved selection
const range = selector?.getSelection();

// Check if selection is inside editor
const isInside = selector?.isSelectionInsideEditor();

// Get selected text
const selectedText = selector?.getSelectedText();

// Get selected elements
const selectedElements = selector?.getSelectedElements();
```

## UI Components

### Toolbar Buttons

Create toolbar buttons using the utility function. The toolbar is obtained through the editor's `getToolbar()` method, which internally retrieves it from the ToolbarPlugin:

```typescript
import { createToolbarButton } from '../ToolbarPlugin/utils';

private addToolbarButton(): void {
  const toolbar = this.editor?.getToolbar();
  if (toolbar) {
    const button = createToolbarButton({
      icon: '🔧',
      title: 'My Plugin',
      onClick: () => this.handleClick(),
      disabled: false
    });
    toolbar.appendChild(button);
  }
}
```

**Important**: Always use `this.editor?.getToolbar()`. The editor's method ensures that the toolbar is obtained from the ToolbarPlugin instance, which may not always be present. If ToolbarPlugin is not loaded, `getToolbar()` will return `null`.

### Popup Manager

Create modal dialogs with the PopupManager:

```typescript
import { PopupManager, type PopupItem } from '../../core/ui/PopupManager';

private createPopup(): void {
  const popup = new PopupManager(this.editor!, {
    title: 'My Plugin Settings',
    className: 'my-plugin-popup',
    closeOnClickOutside: true,
    items: [
      {
        type: 'input',
        id: 'name',
        label: 'Name',
        placeholder: 'Enter name',
        value: ''
      },
      {
        type: 'checkbox',
        id: 'enabled',
        label: 'Enable feature',
        value: true
      },
      {
        type: 'list',
        id: 'type',
        label: 'Type',
        options: ['Option 1', 'Option 2', 'Option 3'],
        value: 'Option 1'
      }
    ],
    buttons: [
      {
        label: 'Save',
        variant: 'primary',
        onClick: () => this.handleSave()
      },
      {
        label: 'Cancel',
        variant: 'secondary',
        onClick: () => popup.hide()
      }
    ]
  });

  // Show popup
  popup.show();

  // Get values
  const name = popup.getValue('name');
  const enabled = popup.getValue('enabled');

  // Set values
  popup.setValue('name', 'New value');

  // Hide popup
  popup.hide();
}
```

### Popup Item Types

Available popup item types:

- **input**: Text input
- **textarea**: Multi-line text input
- **checkbox**: Boolean checkbox
- **list**: Dropdown select
- **radio**: Radio button group
- **number**: Numeric input
- **range**: Slider input
- **color**: Color picker
- **file**: File upload
- **date**: Date picker
- **time**: Time picker
- **datetime-local**: Date and time picker
- **password**: Password input
- **email**: Email input
- **url**: URL input
- **custom**: Custom HTML content
- **button**: Action button
- **divider**: Visual separator
- **progress**: Progress bar
- **loader**: Loading spinner
- **text**: Read-only text

### Context Menus

Create context menus for right-click actions:

```typescript
import { ContextMenu } from '../../core/ui/ContextMenu';

private createContextMenu(): void {
  const contextMenu = new ContextMenu(this.editor!, {
    items: [
      {
        label: 'Action 1',
        icon: '🔧',
        onClick: () => this.handleAction1()
      },
      {
        label: 'Action 2',
        icon: '⚙️',
        onClick: () => this.handleAction2()
      },
      {
        type: 'divider'
      },
      {
        label: 'Submenu',
        icon: '📁',
        submenu: [
          {
            label: 'Sub Action 1',
            onClick: () => this.handleSubAction1()
          },
          {
            label: 'Sub Action 2',
            onClick: () => this.handleSubAction2()
          }
        ]
      }
    ]
  });

  // Show context menu at position
  contextMenu.show(x, y);
}
```

### Notifications

The editor provides a built-in notification system for showing user feedback. All notification methods are available through the editor instance:

```typescript
// Show a basic notification (info type by default)
this.editor.showNotification('Operation completed successfully');

// Show different types of notifications
this.editor.showSuccessNotification('Data saved successfully');
this.editor.showErrorNotification('Failed to save data');
this.editor.showWarningNotification('Please check your input');
this.editor.showInfoNotification('Processing your request...');

// Custom notification with specific duration and type
this.editor.showNotification(
  'Custom message', 
  'success', // 'success' | 'error' | 'warning' | 'info'
  5000 // duration in milliseconds (default: 3000)
);
```

#### Notification Types

- **Success**: Green notification for successful operations
- **Error**: Red notification for errors and failures
- **Warning**: Yellow notification for warnings and cautions
- **Info**: Blue notification for informational messages

#### Notification Features

- **Auto-dismiss**: Notifications automatically disappear after the specified duration
- **Multiple positions**: Notifications can appear in different screen positions
- **Dark mode support**: Notifications adapt to the current theme
- **Responsive design**: Notifications work well on all screen sizes
- **Non-blocking**: Notifications don't interfere with user interaction

#### Best Practices

```typescript
// Good: Clear, actionable messages
this.editor.showSuccessNotification('File uploaded successfully');
this.editor.showErrorNotification('Please check your internet connection');

// Good: Use appropriate notification types
try {
  await this.saveData();
  this.editor.showSuccessNotification('Data saved successfully');
} catch (error) {
  this.editor.showErrorNotification('Failed to save data: ' + error.message);
}

// Good: Provide context for warnings
if (unsavedChanges) {
  this.editor.showWarningNotification('You have unsaved changes');
}

// Good: Inform about long operations
this.editor.showInfoNotification('Processing your request...');
// ... perform operation
this.editor.showSuccessNotification('Request completed');
```

#### Integration with Plugin Actions

```typescript
export class MyPlugin implements Plugin {
  // ... other plugin code

  private handleSave(): void {
    try {
      // Perform save operation
      this.saveData();
      this.editor?.showSuccessNotification('Data saved successfully');
    } catch (error) {
      this.editor?.showErrorNotification('Failed to save data');
    }
  }

  private handleDelete(): void {
    if (this.confirmDeletion()) {
      this.deleteData();
      this.editor?.showSuccessNotification('Item deleted');
    }
  }

  private handleValidation(): void {
    if (!this.validateData()) {
      this.editor?.showWarningNotification('Please check your input');
      return;
    }
    // Continue with valid data
  }
}
```

## Event System

The editor uses a powerful event system for communication between plugins and the editor.

### Listening to Events

```typescript
// Listen to editor events
this.editor.on('content-change', (content) => {
  console.log('Content changed:', content);
});

// Listen to custom events
this.editor.on('my-custom-event', (data) => {
  console.log('Custom event:', data);
});

// Listen to keyboard events
this.editor.on('keydown', (event) => {
  console.log('Key pressed:', event.key);
});

// Listen to selection changes
this.editor.on('selectionchange', (event) => {
  console.log('Selection changed');
});
```

### Triggering Events

```typescript
// Trigger custom events
this.editor.triggerEvent('my-custom-event', { data: 'value' });

// Trigger with multiple arguments
this.editor.triggerEvent('plugin-action', arg1, arg2, arg3);
```

### Common Events

- **content-change**: Fired when content changes
- **selectionchange**: Fired when selection changes
- **keydown**: Fired on keyboard input
- **drag-start**: Fired when drag operation starts
- **drag-end**: Fired when drag operation ends
- **drag-enter**: Fired when element enters drop zone
- **drag-over**: Fired when element is over drop zone
- **drag-leave**: Fired when element leaves drop zone
- **drag-drop**: Fired when element is dropped

### Unsubscribing from Events

```typescript
// Store unsubscribe function
const unsubscribe = this.editor.on('content-change', handler);

// Later, unsubscribe
unsubscribe();

// Or unsubscribe all handlers for an event
this.editor.off('content-change');
```

## Command Pattern

The Command pattern is used for executing and undoing operations. Commands encapsulate actions and can be executed, undone, and redone.

### Creating Commands

```typescript
import type { Command } from '../../../core/commands/Command';

export class MyCommand implements Command {
  private editor: HTMLEditor;
  private data: any;

  constructor(editor: HTMLEditor, data: any) {
    this.editor = editor;
    this.data = data;
  }

  execute(): void {
    // Execute the command
    this.performAction();
  }

  private performAction(): void {
    // Implementation
  }
}
```

### Using Commands

```typescript
// Execute command
const command = new MyCommand(this.editor, data);
command.execute();

// Or trigger via event system
this.editor.triggerEvent('execute-command', command);
```

### Command Examples

```typescript
// Insert content command
export class InsertContentCommand implements Command {
  private content: string;
  private range: Range;

  constructor(editor: HTMLEditor, content: string, range: Range) {
    this.content = content;
    this.range = range.cloneRange();
  }

  execute(): void {
    const fragment = document.createRange().createContextualFragment(this.content);
    this.range.deleteContents();
    this.range.insertNode(fragment);
  }
}

// Delete content command
export class DeleteContentCommand implements Command {
  private range: Range;
  private deletedContent: DocumentFragment;

  constructor(editor: HTMLEditor, range: Range) {
    this.range = range.cloneRange();
  }

  execute(): void {
    this.deletedContent = this.range.extractContents();
  }
}
```

## Services

### HTML Formatter

Format and manipulate HTML content:

```typescript
import { HTMLFormatter } from '../../core/services/HTMLFormatter';

const formatter = new HTMLFormatter();

// Format HTML
const formatted = formatter.format(html);

// Minify HTML
const minified = formatter.minify(html);

// Validate HTML
const isValid = formatter.validate(html);
```

### Text Formatter

Apply text formatting and styles:

```typescript
const formatter = editor.getTextFormatter();

// Apply styles
formatter?.toggleStyle('bold');
formatter?.toggleStyle('italic');
formatter?.toggleStyle('underline');
formatter?.toggleStyle('strikethrough');

// Apply colors
formatter?.setTextColor('#ff0000');
formatter?.setBackgroundColor('#ffff00');

// Apply font
formatter?.setFontFamily('Arial');
formatter?.setFontSize('16px');

// Check styles
const isBold = formatter?.hasClass('bold');
const isItalic = formatter?.hasClass('italic');
```

### Locale Manager

Handle internationalization:

```typescript
import { LocaleManager } from '../../core/services/LocaleManager';

const localeManager = new LocaleManager();

// Initialize with locale
await localeManager.initialize('ru');

// Set locale
await localeManager.setLocale('en');

// Get current locale
const locale = localeManager.getCurrentLocale();

// Get loaded locales
const locales = localeManager.getLoadedLocales();

// Translate text
const translated = localeManager.t('key', { param: 'value' });
```

## Styling

### SCSS Structure

Each plugin should have its own styles:

```scss
// style.scss - Internal styles
.my-plugin {
  &-button {
    // Button styles
  }
  
  &-popup {
    // Popup styles
  }
}

// public.scss - Public styles (for users)
.my-plugin-public {
  // Public styles
}
```

### CSS Classes

Use consistent naming conventions:

```scss
// Plugin-specific classes
.my-plugin {
  // Main plugin container
}

.my-plugin-button {
  // Button styles
}

.my-plugin-button.active {
  // Active state
}

.my-plugin-button:hover {
  // Hover state
}

.my-plugin-button:disabled {
  // Disabled state
}
```

### Theme Support

Support both light and dark themes:

```scss
.my-plugin {
  background: var(--editor-bg);
  color: var(--editor-text);
  border: 1px solid var(--editor-border);
}

// Dark theme
[data-theme="dark"] .my-plugin {
  background: var(--editor-bg-dark);
  color: var(--editor-text-dark);
  border-color: var(--editor-border-dark);
}
```

## Best Practices

### Plugin Structure

1. **Keep plugins focused**: Each plugin should have a single responsibility
2. **Use TypeScript**: Leverage type safety for better development experience
3. **Follow naming conventions**: Use consistent naming for classes, methods, and files
4. **Document your code**: Add JSDoc comments for public methods
5. **Handle errors gracefully**: Always handle potential errors and edge cases

### Performance

1. **Lazy initialization**: Initialize heavy components only when needed
2. **Event cleanup**: Always unsubscribe from events in destroy method
3. **DOM manipulation**: Minimize DOM queries and cache references
4. **Debounce events**: Use debouncing for frequent events like resize or scroll

### Accessibility

1. **Keyboard navigation**: Ensure all functionality is accessible via keyboard
2. **Screen readers**: Add proper ARIA labels and roles
3. **Focus management**: Manage focus properly in modals and popups
4. **Color contrast**: Ensure sufficient color contrast for text

### Error Handling

```typescript
initialize(editor: HTMLEditor): void {
  try {
    this.editor = editor;
    this.setupComponents();
  } catch (error) {
    console.error('Failed to initialize plugin:', error);
    // Handle initialization error
  }
}

private setupComponents(): void {
  if (!this.editor) {
    throw new Error('Editor not available');
  }
  
  // Setup components
}
```

## Advanced Features

### Hotkeys

Register keyboard shortcuts for your plugin:

```typescript
export class MyPlugin implements Plugin {
  hotkeys = [
    { 
      keys: 'Ctrl+Shift+M', 
      description: 'My Plugin Action', 
      command: 'my-plugin-action', 
      icon: '🔧' 
    },
    { 
      keys: 'Alt+M', 
      description: 'Another Action', 
      command: 'my-plugin-another', 
      icon: '⚙️' 
    }
  ];

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    
    // Listen to hotkey events
    this.editor.on('my-plugin-action', () => {
      this.handleAction();
    });
    
    this.editor.on('my-plugin-another', () => {
      this.handleAnotherAction();
    });
  }
}
```

### File Handling

Handle file uploads and drag-and-drop:

```typescript
private setupFileHandling(): void {
  this.editor.on('file-drop', (files: FileList) => {
    this.handleFiles(files);
  });
  
  this.editor.on('paste', (event: ClipboardEvent) => {
    const files = event.clipboardData?.files;
    if (files) {
      this.handleFiles(files);
    }
  });
}

private async handleFiles(files: FileList): Promise<void> {
  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) {
      await this.handleImage(file);
    } else if (file.type.startsWith('video/')) {
      await this.handleVideo(file);
    }
  }
}
```

### Resizable Elements

Make elements resizable:

```typescript
import { ResizableElement } from '../../utils/ResizableElement';

private makeResizable(element: HTMLElement): void {
  const resizable = new ResizableElement(element, {
    minWidth: 100,
    minHeight: 50,
    maxWidth: 800,
    maxHeight: 600,
    onResize: (width, height) => {
      console.log('Resized to:', width, height);
    }
  });
}
```

### Custom Components

Create reusable components:

```typescript
export class MyComponent {
  private element: HTMLElement;

  constructor(options: any) {
    this.element = this.createElement(options);
  }

  private createElement(options: any): HTMLElement {
    const element = document.createElement('div');
    element.className = 'my-component';
    // Build component structure
    return element;
  }

  getElement(): HTMLElement {
    return this.element;
  }

  show(): void {
    this.element.style.display = 'block';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  destroy(): void {
    this.element.remove();
  }
}
```

## Testing

### Unit Testing

Test your plugin components:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MyPlugin } from './MyPlugin';
import { HTMLEditor } from '../../core/HTMLEditor';

describe('MyPlugin', () => {
  let editor: HTMLEditor;
  let plugin: MyPlugin;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    editor = new HTMLEditor(container);
    plugin = new MyPlugin();
  });

  afterEach(() => {
    plugin.destroy();
    editor.destroy();
  });

  it('should initialize correctly', () => {
    plugin.initialize(editor);
    expect(plugin.name).toBe('my-plugin');
  });

  it('should handle events', () => {
    plugin.initialize(editor);
    // Test event handling
  });
});
```

### Integration Testing

Test plugin integration with editor:

```typescript
describe('MyPlugin Integration', () => {
  it('should work with other plugins', () => {
    const editor = new HTMLEditor(container);
    editor.use(new ToolbarPlugin());
    editor.use(new MyPlugin());
    
    // Test integration
  });
});
```

## Examples

### Simple Button Plugin

```typescript
import './style.scss';
import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { createToolbarButton } from '../ToolbarPlugin/utils';

export class SimpleButtonPlugin implements Plugin {
  name = 'simple-button';
  private editor: HTMLEditor | null = null;
  private button: HTMLElement | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addButton();
  }

  private addButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      this.button = createToolbarButton({
        icon: '🔧',
        title: 'Simple Action',
        onClick: () => this.handleClick()
      });
      toolbar.appendChild(this.button);
    }
  }

  private handleClick(): void {
    this.editor?.insertTextAtCursor('Button clicked!');
  }

  destroy(): void {
    this.button?.remove();
    this.editor = null;
  }
}
```

### Modal Plugin

```typescript
import './style.scss';
import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { PopupManager } from '../../core/ui/PopupManager';
import { createToolbarButton } from '../ToolbarPlugin/utils';

export class ModalPlugin implements Plugin {
  name = 'modal';
  private editor: HTMLEditor | null = null;
  private popup: PopupManager | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.createPopup();
    this.addButton();
  }

  private createPopup(): void {
    this.popup = new PopupManager(this.editor!, {
      title: 'Modal Plugin',
      items: [
        {
          type: 'input',
          id: 'text',
          label: 'Enter text',
          placeholder: 'Type something...'
        },
        {
          type: 'checkbox',
          id: 'enabled',
          label: 'Enable feature',
          value: true
        }
      ],
      buttons: [
        {
          label: 'OK',
          variant: 'primary',
          onClick: () => this.handleOK()
        },
        {
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => this.popup?.hide()
        }
      ]
    });
  }

  private addButton(): void {
    const toolbar = this.editor?.getToolbar();
    if (toolbar) {
      const button = createToolbarButton({
        icon: '📋',
        title: 'Open Modal',
        onClick: () => this.popup?.show()
      });
      toolbar.appendChild(button);
    }
  }

  private handleOK(): void {
    const text = this.popup?.getValue('text');
    const enabled = this.popup?.getValue('enabled');
    
    console.log('Modal values:', { text, enabled });
    this.popup?.hide();
  }

  destroy(): void {
    this.popup?.destroy();
    this.editor = null;
  }
}
```

### Event-Driven Plugin

```typescript
import './style.scss';
import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';

export class EventPlugin implements Plugin {
  name = 'event-plugin';
  private editor: HTMLEditor | null = null;
  private unsubscribe: (() => void)[] = [];

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen to content changes
    this.unsubscribe.push(
      this.editor.on('content-change', (content) => {
        console.log('Content changed:', content);
      })
    );

    // Listen to selection changes
    this.unsubscribe.push(
      this.editor.on('selectionchange', () => {
        console.log('Selection changed');
      })
    );

    // Listen to keyboard events
    this.unsubscribe.push(
      this.editor.on('keydown', (event) => {
        if (event.ctrlKey && event.key === 's') {
          event.preventDefault();
          this.handleSave();
        }
      })
    );
  }

  private handleSave(): void {
    const content = this.editor?.getHtml();
    console.log('Saving content:', content);
    // Implement save logic
  }

  destroy(): void {
    // Unsubscribe from all events
    this.unsubscribe.forEach(unsub => unsub());
    this.unsubscribe = [];
    this.editor = null;
  }
}
```

This comprehensive guide covers all aspects of plugin development for On-Codemerge. Use these examples and best practices to create powerful, maintainable plugins that extend the editor's functionality.
