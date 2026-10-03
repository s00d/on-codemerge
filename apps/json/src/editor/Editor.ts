import { ConstrainedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import type { DocNode } from '@codemerge/kernel';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  indentFromDoc,
  docToValue,
  isJsonEditorDoc,
  parseText,
  serializeText,
} from '@ocm/json-plugin';
import type { JsonToolbarOptions } from '@ocm/json-plugin';

export type EditorOptions = Omit<SharedEditorOptions, 'createView' | 'toolbar'> & {
  toolbar?: JsonToolbarOptions;
  createView?: SharedEditorOptions['createView'];
};

export class Editor extends ConstrainedEditor {
  constructor(host: HTMLElement, options: EditorOptions = {}) {
    super(host, {
      ...options,
      doc: options.doc ?? emptyEditorDoc(null),
      createView: options.createView ?? createShellView,
      plugins: options.plugins ?? createDefaultPlugins({ toolbar: options.toolbar }),
    });
  }

  protected isConstrainedDoc(doc: DocNode): boolean {
    return isJsonEditorDoc(doc);
  }

  protected constrainedDocError(): string {
    return 'JSON Editor document must be doc with a single json child';
  }

  getText(indent?: number | string): string {
    const doc = this.getState().doc;
    return serializeText(docToValue(doc), indent === undefined ? indentFromDoc(doc) : indent);
  }

  setText(text: string): Error | null {
    const result = parseText(text, indentFromDoc(this.getState().doc));
    if (!result.ok) {
      return result.error;
    }
    this.replaceDocument(result.doc);
    return null;
  }
}
