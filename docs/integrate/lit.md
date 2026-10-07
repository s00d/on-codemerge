# Lit

`@codemerge/integrate/lit` registers `<ocm-editor>` (same as `/element`).

## Value + changes

```ts
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@codemerge/integrate/lit';

@customElement('page-editor')
export class PageEditor extends LitElement {
  @state() private doc = '<p></p>';

  render() {
    return html`
      <ocm-editor
        value=${this.doc}
        format="html"
        @change=${(e: CustomEvent<{ value: string }>) => {
          this.doc = e.detail.value;
        }}
      ></ocm-editor>
    `;
  }
}
```

Or listen for `change` / call `configure()` — [Host config](./host-config.md). Load/save: [Persistence](./persistence.md).
