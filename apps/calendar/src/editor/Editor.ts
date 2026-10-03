import { ConstrainedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import type { DocNode } from '@codemerge/kernel';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isCalendarEditorDoc,
  parseText,
  serializeText,
  payloadFromDoc,
} from '../../../../plugins/CalendarPlugin';
import type { CalendarToolbarOptions, CalendarDoc } from '../../../../plugins/CalendarPlugin';

export type EditorOptions = Omit<SharedEditorOptions, 'createView' | 'toolbar'> & {
  toolbar?: CalendarToolbarOptions;
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
    return isCalendarEditorDoc(doc);
  }

  protected constrainedDocError(): string {
    return 'Calendar Editor document must be doc with a single calendar child';
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

  getJSONConfig(): CalendarDoc {
    return payloadFromDoc(this.getState().doc);
  }

  setJSONConfig(payload: CalendarDoc): void {
    this.replaceDocument(emptyEditorDoc(payload));
  }
}
