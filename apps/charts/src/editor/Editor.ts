import { ConstrainedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import type { DocNode } from '@codemerge/kernel';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isChartEditorDoc,
  parseText,
  serializeText,
  attrsFromDoc,
} from '@ocm/charts-plugin';
import type { ChartToolbarOptions, ChartAttrs } from '@ocm/charts-plugin';

export type EditorOptions = Omit<SharedEditorOptions, 'createView' | 'toolbar'> & {
  toolbar?: ChartToolbarOptions;
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
    return isChartEditorDoc(doc);
  }

  protected constrainedDocError(): string {
    return 'Charts Editor document must be doc with a single chart child';
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

  getJSONConfig(): ChartAttrs {
    return attrsFromDoc(this.getState().doc);
  }

  setJSONConfig(attrs: ChartAttrs): void {
    this.replaceDocument(emptyEditorDoc(attrs));
  }
}
