import { ConstrainedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import type { DocNode } from '@codemerge/kernel';
import {
  composePublishedDocument,
  neededRuntimeIds,
  publishedCssHref,
  publishedJsHref,
} from '@codemerge/sdk';
import { exportMarkdown, importHTML } from '@ocm/wysiwyg/io';
import {
  createDefaultPlugins,
  createMdElementRegistry,
  emptyEditorDoc,
  isMarkdownEditorDoc,
  parseText,
  projectPreviewHtml,
  serializeDoc,
} from '@ocm/markdown-plugin';
import type {
  MdCustomElement,
  MdElementRegistry,
  MdRemotePreviewOptions,
  MdToolbarOptions,
} from '@ocm/markdown-plugin';

export type EditorOptions = Omit<SharedEditorOptions, 'createView' | 'toolbar'> & {
  toolbar?: MdToolbarOptions;
  elements?: MdCustomElement[];
  preview?: MdRemotePreviewOptions;
  createView?: SharedEditorOptions['createView'];
};

export class Editor extends ConstrainedEditor {
  private readonly elements: MdElementRegistry;

  constructor(host: HTMLElement, options: EditorOptions = {}) {
    const elements = createMdElementRegistry(options.elements ?? []);
    super(host, {
      ...options,
      doc: options.doc ?? emptyEditorDoc(''),
      createView: options.createView ?? createShellView,
      plugins:
        options.plugins ??
        createDefaultPlugins({
          elements: options.elements,
          toolbar: options.toolbar,
          preview: options.preview,
        }),
    });
    this.elements = elements;
  }

  protected isConstrainedDoc(doc: DocNode): boolean {
    return isMarkdownEditorDoc(doc);
  }

  protected constrainedDocError(): string {
    return 'Markdown Editor document must be a prose Markdown SoT (doc with MD block children)';
  }

  getText(): string {
    return serializeDoc(this.getState().doc);
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
    return projectPreviewHtml(this.getState().doc, { elements: this.elements });
  }

  override setHTML(html: string): void {
    const md = exportMarkdown(importHTML(html));
    const err = this.setText(md);
    if (err) {
      this.notify(err.message);
    }
  }

  override getPublishedHTML(): string {
    const body = this.getHTML();
    if (!body) {
      return '';
    }
    if (
      body.includes('data-node="mermaid"') ||
      body.includes('ocm-md-mermaid') ||
      body.includes('data-ocm-mermaid')
    ) {
      return `<div class="ocm-md-publish" data-ocm-runtime="md-mermaid">${body}</div>`;
    }
    return body;
  }

  override getPublishedJS(): string | null {
    const html = this.getPublishedHTML();
    return neededRuntimeIds(html).length > 0 ? publishedJsHref() : null;
  }

  override getPublishedDocument(): string {
    const bodyHtml = this.getPublishedHTML();
    return composePublishedDocument({
      bodyHtml,
      cssHref: publishedCssHref(),
      jsHref: neededRuntimeIds(bodyHtml).length > 0 ? publishedJsHref() : null,
    });
  }
}
