import { ConstrainedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import type { DocNode } from '@codemerge/kernel';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isCodeEditorDoc,
  languageFromDoc,
  parseText,
  serializeText,
} from '@ocm/code-block-plugin';
import type { CodeToolbarOptions } from '@ocm/code-block-plugin';
import { codeWorkspaceByEditor } from '@ocm/code-block-plugin/surface/workspaceView';

export type EditorOptions = Omit<SharedEditorOptions, 'createView' | 'toolbar'> & {
  toolbar?: CodeToolbarOptions;
  createView?: SharedEditorOptions['createView'];
};

export class Editor extends ConstrainedEditor {
  constructor(host: HTMLElement, options: EditorOptions = {}) {
    super(host, {
      ...options,
      doc: options.doc ?? emptyEditorDoc(''),
      createView: options.createView ?? createShellView,
      plugins: options.plugins ?? createDefaultPlugins({ toolbar: options.toolbar }),
    });
  }

  protected isConstrainedDoc(doc: DocNode): boolean {
    return isCodeEditorDoc(doc);
  }

  protected constrainedDocError(): string {
    return 'Code Editor document must be doc with a single code_source child';
  }

  getText(): string {
    codeWorkspaceByEditor.get(this)?.flushPendingSoT();
    return serializeText(this.getState().doc);
  }

  setText(text: string): Error | null {
    const result = parseText(text, languageFromDoc(this.getState().doc));
    if (!result.ok) {
      return result.error;
    }
    this.replaceDocument(result.doc);
    return null;
  }
}
