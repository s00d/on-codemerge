import { Editor as SharedEditor, createShellView } from '@on-codemerge/editor';
import type { SharedEditorOptions } from '@on-codemerge/editor';
import { applyTransaction, docFromJSON } from '@on-codemerge/kernel';
import type { Command, DocNode, JSONDoc, Transaction } from '@on-codemerge/kernel';
import type { PluginDefinition } from '@on-codemerge/sdk';
import {
  composePublishedDocument,
  neededRuntimeIds,
  publishedCssHref,
  publishedJsHref,
} from '@on-codemerge/sdk';
import type { Translations } from '@i18n-micro/runtime';
import { exportMarkdown, importHTML } from '@ocm/wysiwyg/io';
import {
  createDefaultPlugins,
  createMdElementRegistry,
  emptyEditorDoc,
  isMarkdownEditorDoc,
  parseText,
  projectPreviewHtml,
  serializeDoc,
} from '../../../../plugins/MarkdownPlugin';
import type {
  MdCustomElement,
  MdElementRegistry,
  MdRemotePreviewOptions,
  MdToolbarOptions,
  ParseError,
} from '../../../../plugins/MarkdownPlugin';

/** Markdown entry construct bag — `createView` optional (defaults shell ViewPort). */
export interface EditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  locale?: string;
  fallbackLocale?: string;
  messages?: Record<string, Translations>;
  colorScheme?: 'host' | 'system';
  chrome?: 'bar' | 'page';
  /** Extra custom elements (merged with info/warn/error builtins). */
  elements?: MdCustomElement[];
  /** Declarative toolbar menus / items (passed to MarkdownPlugin workspace). */
  toolbar?: MdToolbarOptions;
  /**
   * Remote right-pane preview: POST `{ markdown }` → `text/html`.
   * Omit → local projector. Does not affect `getHTML` / publish.
   */
  preview?: MdRemotePreviewOptions;
  /** Override default shell ViewPort (advanced hosts). */
  createView?: SharedEditorOptions['createView'];
}

/**
 * Thin Markdown app entry: shell ViewPort + MarkdownPlugin workspace.
 * Persist: `getText` / `setText`. Compatibility: `getHTML` / `setHTML` (lossy HTML↔MD).
 */
export class Editor extends SharedEditor {
  private readonly elements: MdElementRegistry;

  constructor(host: HTMLElement, options: EditorOptions = {}) {
    const elements = createMdElementRegistry(options.elements ?? []);
    const shared: SharedEditorOptions = {
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
    };
    super(host, shared);
    this.elements = elements;
  }

  /** Plain Markdown (primary interchange). */
  getText(): string {
    return serializeDoc(this.getState().doc);
  }

  /**
   * Replace SoT with plain Markdown. Oversized → ParseError, SoT unchanged.
   */
  setText(text: string): ParseError | null {
    const result = parseText(text);
    if (!result.ok) {
      return result.error;
    }
    this.replaceDocument(result.doc);
    return null;
  }

  /** Sanitized preview HTML from prose SoT (same projector as the right pane). */
  override getHTML(): string {
    return projectPreviewHtml(this.getState().doc, { elements: this.elements });
  }

  /**
   * HTML → prose → Markdown → SoT (lossy). Invalid/oversized MD after convert → notify, SoT unchanged.
   */
  override setHTML(html: string): void {
    const md = exportMarkdown(importHTML(html));
    const err = this.setText(md);
    if (err) {
      this.notify(err.message);
    }
  }

  /**
   * Published body: same projector as live preview; mermaid hosts get `data-ocm-runtime`
   * so `public.js` can hydrate.
   */
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

  private accepts(tr: Transaction): boolean {
    const { state } = applyTransaction(this.getState(), tr, this.schema);
    return isMarkdownEditorDoc(state.doc);
  }

  private assertMarkdownDoc(json: JSONDoc | DocNode): DocNode {
    const doc = docFromJSON(json);
    if (!isMarkdownEditorDoc(doc)) {
      throw new TypeError(
        'Markdown Editor document must be a prose Markdown SoT (doc with MD block children)'
      );
    }
    return doc;
  }

  override setJSON(json: JSONDoc | DocNode): void {
    super.setJSON(this.assertMarkdownDoc(json));
  }

  override replaceDocument(json: JSONDoc | DocNode): void {
    super.replaceDocument(this.assertMarkdownDoc(json));
  }

  override dispatch(tr: Transaction): void {
    const onlySelection = tr.ops.length > 0 && tr.ops.every((o) => o.type === 'set_selection');
    if (!onlySelection && !this.accepts(tr)) {
      return;
    }
    super.dispatch(tr);
  }

  override command(name: string): boolean {
    const before = this.getState();
    if (!super.command(name)) {
      return false;
    }
    const after = this.getState();
    return after.doc !== before.doc || after.selection !== before.selection;
  }

  override run(command: Command): boolean {
    const before = this.getState();
    if (!super.run(command)) {
      return false;
    }
    const after = this.getState();
    return after.doc !== before.doc || after.selection !== before.selection;
  }
}
