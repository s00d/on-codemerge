import { ConstrainedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import type { DocNode } from '@codemerge/kernel';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isTableEditorDoc,
  parseText,
  serializeText,
  gridFromDoc,
  docFromGrid,
  gridToHtml,
  htmlToGrid,
  gridToMarkdown,
  markdownToGrid,
} from '@ocm/table-plugin';
import type { TableToolbarOptions, TableGridDoc } from '@ocm/table-plugin';

export type EditorOptions = Omit<SharedEditorOptions, 'createView' | 'toolbar'> & {
  toolbar?: TableToolbarOptions;
  createView?: SharedEditorOptions['createView'];
};

export class Editor extends ConstrainedEditor {
  constructor(host: HTMLElement, options: EditorOptions = {}) {
    super(host, {
      ...options,
      doc: options.doc ?? emptyEditorDoc(),
      createView: options.createView ?? createShellView,
      plugins: options.plugins ?? createDefaultPlugins({ toolbar: options.toolbar }),
    });
  }

  protected isConstrainedDoc(doc: DocNode): boolean {
    return isTableEditorDoc(doc);
  }

  protected constrainedDocError(): string {
    return 'Tables Editor document must be doc with a single tableGrid child';
  }

  getText(indent: number | string = 2): string {
    return serializeText(this.getState().doc, indent);
  }

  setText(text: string): Error | null {
    const result = parseText(text);
    if (!result.ok) {
      return result.error;
    }
    this.replaceDocument(result.doc);
    return null;
  }

  override getHTML(): string {
    return gridToHtml(this.getGrid());
  }

  override setHTML(html: string): void {
    this.setGrid(htmlToGrid(html));
  }

  setHtml(html: string): void {
    this.setHTML(html);
  }

  override getMarkdown(): string {
    return gridToMarkdown(this.getGrid());
  }

  override setMarkdown(md: string): void {
    this.setGrid(markdownToGrid(md));
  }

  getMd(): string {
    return this.getMarkdown();
  }

  setMd(md: string): void {
    this.setMarkdown(md);
  }

  getGrid(): TableGridDoc {
    return gridFromDoc(this.getState().doc);
  }

  setGrid(grid: TableGridDoc): void {
    this.replaceDocument(docFromGrid(grid));
  }
}
