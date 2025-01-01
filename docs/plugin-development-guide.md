---
sidebar_position: 6
---

# Plugin Development Guide

Welcome to the **Plugin Development Guide** for **On-Codemerge**, a flexible web editor designed to be easily extended with custom plugins. This guide will walk you through the process of creating a new plugin, including setting up the structure, creating menus, modals, and handling events.

## Plugin Structure

A plugin in On-Codemerge is a class that implements the `Plugin` interface. The basic structure of a plugin includes:

- **Initialization**: The `initialize` method is called when the plugin is registered with the editor.
- **Destruction**: The `destroy` method is called when the plugin is removed or the editor is destroyed.
- **Event Handling**: Plugins can listen to and trigger events within the editor.

### Basic Plugin Template

Here’s a basic template for a plugin:

```typescript
import { Plugin, HTMLEditor } from 'on-codemerge';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  private editor: HTMLEditor | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    // Initialize your plugin here
  }

  destroy(): void {
    // Clean up your plugin here
    this.editor = null;
  }
}
```

## Creating Menus

Plugins can add custom menus to the editor’s toolbar or context menu. Here’s an example of how to create a toolbar button:

```typescript
import { createToolbarButton } from 'on-codemerge/plugins/ToolbarPlugin/utils';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  private editor: HTMLEditor | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.addToolbarButton();
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      const button = createToolbarButton({
        icon: '⭐', // Use an icon or text
        title: 'My Plugin Button',
        onClick: () => {
          this.handleButtonClick();
        },
      });
      toolbar.appendChild(button);
    }
  }

  private handleButtonClick(): void {
    // Handle button click event
    console.log('Button clicked!');
  }

  destroy(): void {
    // Clean up your plugin here
    this.editor = null;
  }
}
```

## Creating Modals

Plugins can also create modals for more complex interactions. Here’s an example of how to create a modal:

```typescript
import { PopupManager } from 'on-codemerge/core/ui/PopupManager';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  private editor: HTMLEditor | null = null;
  private popup: PopupManager | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.setupPopup();
  }

  private setupPopup(): void {
    this.popup = new PopupManager(this.editor, {
      title: 'My Plugin Modal',
      closeOnClickOutside: true,
      buttons: [
        {
          label: 'Confirm',
          variant: 'primary',
          onClick: () => this.handleConfirm(),
        },
        {
          label: 'Cancel',
          variant: 'secondary',
          onClick: () => this.popup?.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'my-plugin-content',
          content: () => this.createPopupContent(),
        },
      ],
    });
  }

  private createPopupContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'p-4';
    container.textContent = 'This is the content of my modal.';
    return container;
  }

  private handleConfirm(): void {
    // Handle confirm action
    console.log('Confirmed!');
    this.popup?.hide();
  }

  destroy(): void {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }
    this.editor = null;
  }
}
```

## Handling Events

Plugins can listen to and trigger events within the editor. Here’s an example of how to handle content changes:

```typescript
export class MyPlugin implements Plugin {
  name = 'my-plugin';
  private editor: HTMLEditor | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.editor?.subscribeToContentChange((newContent?: string) => {
      console.log('Content changed:', newContent);
    });
  }

  destroy(): void {
    // Clean up your plugin here
    this.editor = null;
  }
}
```

## Example Plugin: Table Plugin

Here’s an example of a more complex plugin that adds table functionality to the editor:

```typescript
import { Plugin, HTMLEditor } from 'on-codemerge';
import { TablePopup } from './components/TablePopup';
import { TableContextMenu } from './components/TableContextMenu';
import { createToolbarButton } from 'on-codemerge/plugins/ToolbarPlugin/utils';

export class TablePlugin implements Plugin {
  name = 'table';
  private editor: HTMLEditor | null = null;
  private popup: TablePopup | null = null;
  private contextMenu: TableContextMenu | null = null;

  initialize(editor: HTMLEditor): void {
    this.editor = editor;
    this.popup = new TablePopup(editor);
    this.contextMenu = new TableContextMenu(editor);
    this.addToolbarButton();
    this.setupTableEvents();
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
      const button = createToolbarButton({
        icon: '📊',
        title: 'Insert Table',
        onClick: () => {
          this.popup?.show((options) => this.insertTable(options));
        },
      });
      toolbar.appendChild(button);
    }
  }

  private setupTableEvents(): void {
    if (!this.editor || !this.contextMenu) return;

    const container = this.editor.getContainer();
    container.addEventListener('contextmenu', this.handleContextMenu);
  }

  private handleContextMenu = (e: Event): void => {
    const cell = (e.target as Element).closest('td, th');
    if (cell instanceof HTMLTableCellElement) {
      e.preventDefault();
      this.contextMenu?.show(cell, (e as MouseEvent).clientX, (e as MouseEvent).clientY);
    }
  };

  private insertTable(options: { rows: number; cols: number; hasHeader: boolean }): void {
    if (!this.editor) return;

    this.editor.ensureEditorFocus();

    const command = new InsertTableCommand(this.editor, options);
    command.execute();
  }

  destroy(): void {
    if (this.popup) {
      this.popup.destroy();
      this.popup = null;
    }

    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    this.editor = null;
  }
}
```

## Conclusion

This guide covers the basics of plugin development for **On-Codemerge**, including creating menus, modals, and handling events. By following these examples, you can extend the editor’s functionality to suit your specific needs. Happy coding!
