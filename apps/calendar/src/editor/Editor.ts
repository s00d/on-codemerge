import { Editor as SharedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import { applyTransaction, docFromJSON } from '@codemerge/kernel';
import type { Command, DocNode, JSONDoc, Transaction } from '@codemerge/kernel';
import type { PluginDefinition } from '@codemerge/sdk';
import type { Translations } from '@i18n-micro/runtime';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isCalendarEditorDoc,
  parseText,
  serializeText,
  payloadFromDoc,
} from '../../../../plugins/CalendarPlugin';
import type {
  CalendarToolbarOptions,
  ParseError,
  CalendarDoc,
} from '../../../../plugins/CalendarPlugin';

/** Calendar entry construct bag — `createView` optional (defaults shell ViewPort). */
export interface EditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  locale?: string;
  fallbackLocale?: string;
  messages?: Record<string, Translations>;
  colorScheme?: 'host' | 'system';
  chrome?: 'bar' | 'page';
  toolbar?: CalendarToolbarOptions;
  createView?: SharedEditorOptions['createView'];
}

/**
 * Thin Calendar app entry: shell ViewPort + CalendarPlugin workspace + getText/setText.
 */
export class Editor extends SharedEditor {
  constructor(host: HTMLElement, options: EditorOptions = {}) {
    const shared: SharedEditorOptions = {
      ...options,
      doc: options.doc ?? emptyEditorDoc(),
      createView: options.createView ?? createShellView,
      plugins: options.plugins ?? createDefaultPlugins({ toolbar: options.toolbar }),
    };
    super(host, shared);
  }

  /** Pretty CalendarDoc JSON. */
  getText(indent: number | string = 2): string {
    return serializeText(this.getState().doc, indent);
  }

  setText(text: string): ParseError | null {
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

  private accepts(tr: Transaction): boolean {
    const { state } = applyTransaction(this.getState(), tr, this.schema);
    return isCalendarEditorDoc(state.doc);
  }

  private assertCalendarDoc(json: JSONDoc | DocNode): DocNode {
    const doc = docFromJSON(json);
    if (!isCalendarEditorDoc(doc)) {
      throw new TypeError('Calendar Editor document must be doc with a single calendar child');
    }
    return doc;
  }

  override setJSON(json: JSONDoc | DocNode): void {
    super.setJSON(this.assertCalendarDoc(json));
  }

  override replaceDocument(json: JSONDoc | DocNode): void {
    super.replaceDocument(this.assertCalendarDoc(json));
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
