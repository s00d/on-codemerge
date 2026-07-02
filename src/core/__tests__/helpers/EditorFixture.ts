import { TextFormatter } from '../../services/TextFormatter';
import type { FormatDebugMap } from '../../services/TextFormatter/FormatDebugMap';
import { SelectionHelper } from './SelectionHelper';

export class EditorFixture {
  readonly container: HTMLElement;
  readonly formatter: TextFormatter;
  readonly selection: SelectionHelper;

  private constructor(container: HTMLElement, formatDebug = false) {
    this.container = container;
    this.formatter = new TextFormatter(container, undefined, formatDebug);
    this.selection = new SelectionHelper(container);
  }

  static create(html = '', formatDebug = false): EditorFixture {
    const container = document.createElement('div');
    container.className = 'html-editor';
    container.contentEditable = 'true';
    container.innerHTML = html;
    document.body.appendChild(container);
    return new EditorFixture(container, formatDebug);
  }

  destroy(): void {
    document.body.innerHTML = '';
  }

  get html(): string {
    return this.container.innerHTML;
  }

  toggle(style: string): void {
    this.formatter.toggleStyle(style);
  }

  toggleWithDebug(style: string): FormatDebugMap | null {
    this.formatter.enableFormatDebug(true);
    this.formatter.toggleStyle(style);
    return this.formatter.getLastDebugMap();
  }

  getDebugMap(): FormatDebugMap | null {
    return this.formatter.getLastDebugMap();
  }

  hasClass(style: string): boolean {
    return this.formatter.hasClass(style);
  }

  normalizedHtml(): string {
    return this.html.replace(/\u200B/g, '').replace(/>\s+</g, '><').trim();
  }

  getSelectionText(): string {
    return window.getSelection()?.toString() ?? '';
  }

  assertNoFormatOnBlocks(className: string): void {
    const blocks = this.container.querySelectorAll('div, p');
    blocks.forEach((el) => {
      if (el.classList.contains(className)) {
        throw new Error(`Format class ${className} applied to block ${el.tagName}`);
      }
    });
    if (this.container.classList.contains(className)) {
      throw new Error(`Format class ${className} applied to editor container`);
    }
  }
}
