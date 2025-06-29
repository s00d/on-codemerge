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
npm install on-codemerge
```

## Angular Integration Example

Here's an example that demonstrates how to integrate On-Codemerge into an Angular project:

```typescript title="editor.component.ts"
import { Component, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { HTMLEditor, ToolbarPlugin, AlignmentPlugin } from 'on-codemerge';
import 'on-codemerge/public.css';
import 'on-codemerge/index.css';
import 'on-codemerge/plugins/ToolbarPlugin/style.css';
import 'on-codemerge/plugins/AlignmentPlugin/public.css';
import 'on-codemerge/plugins/AlignmentPlugin/style.css';

@Component({
  selector: 'app-editor',
  template: `<div #editorContainer style="min-height: 300px;"></div>`,
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private editor: HTMLEditor | null = null;

  async ngAfterViewInit() {
    if (this.editorContainer?.nativeElement) {
      this.editor = new HTMLEditor(this.editorContainer.nativeElement);

      // Set locale
      await this.editor.setLocale('ru');

      // Register plugins
      this.editor.use(new ToolbarPlugin());
      this.editor.use(new AlignmentPlugin());

      // Subscribe to content changes
      this.editor.subscribeToContentChange((newContent: string) => {
        this.valueChange.emit(newContent);
      });

      // Set initial content
      if (this.value) {
        this.editor.setHtml(this.value);
      }
    }
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  // Method to update content from parent component
  updateContent(content: string) {
    if (this.editor && content !== this.editor.getHtml()) {
      this.editor.setHtml(content);
    }
  }
}
```

## Usage Example

```typescript title="app.component.ts"
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h1>My Angular App with On-Codemerge</h1>
    <app-editor [(value)]="content"></app-editor>
    <div>
      <h3>Current HTML:</h3>
      <pre>{{ content }}</pre>
    </div>
  `
})
export class AppComponent {
  content: string = '<p>Initial content</p>';
}
```

## Module Configuration

```typescript title="app.module.ts"
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { EditorComponent } from './editor.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## Key Features

- **Angular Integration**: Full compatibility with Angular's component system
- **Two-way Binding**: Support for `[(value)]` two-way data binding
- **TypeScript**: Complete TypeScript support with proper type definitions
- **Lifecycle Management**: Proper cleanup in `ngOnDestroy`
- **Plugin System**: Easy plugin registration and management
- **Localization**: Built-in multi-language support
- **Content Management**: Simple HTML content setting and retrieval
