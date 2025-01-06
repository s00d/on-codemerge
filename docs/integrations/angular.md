---
sidebar_position: 5
---

# Angular

Welcome to the Angular-specific documentation for **On-Codemerge**, an adaptable web editor designed for easy integration with Angular applications.

## Getting Started with Angular

Integrating On-Codemerge into your Angular project is straightforward. Begin by installing the package.

### Installation

Run the following command in your Angular project directory to install `on-codemerge`:

```bash
npm i --save on-codemerge
```

## Angular Integration Example

Here's an example that demonstrates how to integrate On-Codemerge into an Angular project using the new plugin version:

```typescript title="app.component.ts"
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';

@Component({
  selector: 'app-root',
  template: `<div #editorContainer></div>`
})
export class AppComponent implements AfterViewInit {
  @ViewChild('editorContainer') editorContainer: ElementRef;

  async ngAfterViewInit() {
    const editor = new HTMLEditor(this.editorContainer.nativeElement);

    await editor.setLocale('ru');

    editor.use(new ToolbarPlugin());
    editor.use(new AlignmentPlugin());
    // ... register other modules

    editor.subscribeToContentChange((newContent?: string) => {
      console.log('Content changed:', newContent);
    });

    // Optional: Set initial content
    editor.setHtml('Your initial content here');
    console.log(editor.getHtml());
  }
}
```

### Key Points

1. **HTMLEditor Initialization**: The `HTMLEditor` is initialized with a container element.
2. **Locale Setting**: The `setLocale` method is used to set the editor's language (e.g., `'ru'` for Russian).
3. **Plugin Registration**: Plugins like `ToolbarPlugin` and `AlignmentPlugin` are registered using the `use` method.
4. **Content Subscription**: The `subscribeToContentChange` method listens for changes in the editor's content.
5. **HTML Content Management**: The `setHtml` and `getHtml` methods are used to set and retrieve the editor's content in HTML format.

### Example with Additional Plugins

To add more plugins, import and register them similarly:

```typescript
import { TablePlugin, ImagePlugin } from 'on-codemerge';

// Inside ngAfterViewInit
editor.use(new TablePlugin());
editor.use(new ImagePlugin());
```

### Usage

1. Add a container element in your template using `#editorContainer`.
2. Initialize the editor in the `ngAfterViewInit` lifecycle hook.
3. Register the required plugins and subscribe to content changes.

This approach ensures seamless integration of On-Codemerge into Angular applications using the latest plugin version.
