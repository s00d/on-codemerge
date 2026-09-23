# Angular

Embed On-Codemerge in Angular (standalone component). Persist **JSON** (`getJSON` / `setJSON`), not HTML.

Verified with Angular CLI 19 + `on-codemerge@2.0.3` (`ng build`, browser smoke).

## Install

```bash
npm install on-codemerge
```

Import editor CSS once in global styles:

```css
/* styles.css */
@import 'on-codemerge/index.css';
@import 'on-codemerge/public.css';
```

## Minimal example

Working standalone host from the temp app:

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Editor, createCorePlugins } from 'on-codemerge';

const INITIAL = {
  version: 1 as const,
  doc: {
    type: 'doc' as const,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello from Angular' }],
      },
    ],
  },
};

@Component({
  selector: 'app-editor',
  standalone: true,
  template: `<div #host style="min-height: 300px"></div>`,
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  private editor: Editor | null = null;

  ngAfterViewInit(): void {
    this.editor = new Editor(this.host.nativeElement, {
      plugins: createCorePlugins(),
    });
    this.editor.setJSON(INITIAL);
    this.editor.on('docChanged', () => {
      const json = this.editor!.getJSON();
      // emit / save json
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }
}
```

## Persist

```ts
this.editor.on('docChanged', () => {
  const json = this.editor!.getJSON();
  // POST / save
});
```

HTML / Markdown are boundaries only.

## Gotchas

- Mount in `ngAfterViewInit` (host element must exist).
- Destroy in `ngOnDestroy`.
- Prefer global `@import` for CSS so Angular’s bundler resolves package paths.
- Initial production budget may warn — editor + CSS is large; raise budgets if needed.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Plugins overview](/plugins/)
- [Integrate overview](/integrate/)
