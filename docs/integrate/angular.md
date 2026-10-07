# Angular

`@codemerge/integrate/angular` is an alias of `/mount` (`mountCodeMergeEditor` + CSS). No Angular component — mount into a host `div`.

## Value + changes

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { mountCodeMergeEditor } from '@codemerge/integrate/angular';
import type { EditorHostHandle } from '@codemerge/integrate/angular';

@Component({
  selector: 'app-editor',
  template: `<div #host style="min-height:300px"></div>`,
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLDivElement>;
  html = '<p></p>';
  private handle: EditorHostHandle | null = null;

  ngAfterViewInit() {
    this.handle = mountCodeMergeEditor(this.hostEl.nativeElement, {
      value: this.html,
      onChange: (value) => {
        this.html = value;
      },
    });
  }

  ngOnDestroy() {
    this.handle?.destroy();
  }
}
```

Packs / upload via mount options — [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
