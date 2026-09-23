# Angular

> Archive: on-codemerge **v1** API (`HTMLEditor`, class plugins). Current docs: [Guide](/guide/editor) · [Migrate](/guide/migration-v1-to-v2).


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


_…trimmed for the v1 archive. See source history for the full guide._
