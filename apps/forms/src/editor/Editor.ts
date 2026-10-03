import { ConstrainedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import type { DocNode } from '@codemerge/kernel';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isFormEditorDoc,
  parseText,
  serializeText,
  configFromDoc,
} from '../../../../plugins/FormBuilderPlugin';
import type { FormToolbarOptions, FormConfig } from '../../../../plugins/FormBuilderPlugin';

export type EditorOptions = Omit<SharedEditorOptions, 'createView' | 'toolbar'> & {
  toolbar?: FormToolbarOptions;
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
    return isFormEditorDoc(doc);
  }

  protected constrainedDocError(): string {
    return 'Forms Editor document must be doc with a single form child';
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

  getJSONConfig(): FormConfig {
    return configFromDoc(this.getState().doc);
  }

  setJSONConfig(config: FormConfig): void {
    this.replaceDocument(emptyEditorDoc(config));
  }
}
