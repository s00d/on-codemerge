# Angular

Embed On-Codemerge in an Angular standalone component. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge
```

```css
/* styles.css */
@import 'on-codemerge/index.css';
@import 'on-codemerge/public.css';
```

## Minimal example

```ts
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { Editor, createCorePlugins } from 'on-codemerge';

@Component({
  selector: 'app-editor',
  standalone: true,
  template: `<div #host style="min-height: 300px"></div>`,
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  @Input() value = '<p>Hello from Angular</p>';
  @Output() valueChange = new EventEmitter<string>();
  private editor: Editor | null = null;

  ngAfterViewInit(): void {
    this.editor = new Editor(this.host.nativeElement, {
      plugins: createCorePlugins(),
    });
    this.editor.setHTML(this.value);
    this.editor.on('docChanged', () => {
      this.valueChange.emit(this.editor!.getHTML());
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }
}
```

### Extract

```ts
const html = this.editor!.getHTML();
const md = this.editor!.getMarkdown();
```

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
