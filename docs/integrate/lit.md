# Lit

Web Component wrapper for On-Codemerge. Load / save with **HTML** (or Markdown).

## Install

```bash
npm install on-codemerge lit
```

## Minimal example

```ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Editor, createCorePlugins } from 'on-codemerge';
import 'on-codemerge/index.css';
import 'on-codemerge/public.css';

@customElement('ocm-editor')
export class OcmEditor extends LitElement {
  @property({ type: String }) value = '<p>Hello from Lit</p>';
  private editor: Editor | null = null;
  private hostEl!: HTMLDivElement;

  static styles = css`
    :host {
      display: block;
      min-height: 300px;
    }
  `;

  firstUpdated() {
    this.hostEl = this.renderRoot.querySelector('#host') as HTMLDivElement;
    this.editor = new Editor(this.hostEl, { plugins: createCorePlugins() });
    this.editor.setHTML(this.value);
    this.editor.on('docChanged', () => {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { html: this.editor!.getHTML() },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  disconnectedCallback() {
    this.editor?.destroy();
    this.editor = null;
    super.disconnectedCallback();
  }

  render() {
    return html`<div id="host"></div>`;
  }
}
```

### Extract

```ts
const html = editor.getHTML();
const md = editor.getMarkdown();
```

## Gotchas

- Prefer light DOM or import CSS into the document; Shadow DOM can isolate styles unless you pierce them.
- Destroy in `disconnectedCallback`.

## Related

- [Chrome & host](./chrome-and-host.md)
- [Editor API](/guide/editor)
- [Integrate overview](/integrate/)
