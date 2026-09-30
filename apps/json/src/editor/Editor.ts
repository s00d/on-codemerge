import { Editor as SharedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import { applyTransaction, docFromJSON } from '@codemerge/kernel';
import type { Command, DocNode, JSONDoc, Transaction } from '@codemerge/kernel';
import type { PluginDefinition } from '@codemerge/sdk';
import type { Translations } from '@i18n-micro/runtime';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  indentFromDoc,
  docToValue,
  isJsonEditorDoc,
  parseText,
  serializeText,
} from '../../../../plugins/JsonPlugin';
import type { JsonToolbarOptions, ParseError } from '../../../../plugins/JsonPlugin';

/** JSON entry construct bag — `createView` optional (defaults shell ViewPort). */
export interface EditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  locale?: string;
  fallbackLocale?: string;
  messages?: Record<string, Translations>;
  colorScheme?: 'host' | 'system';
  chrome?: 'bar' | 'page';
  /** Declarative toolbar menus / items (passed to JsonPlugin workspace). */
  toolbar?: JsonToolbarOptions;
  /** Override default shell ViewPort (advanced hosts). */
  createView?: SharedEditorOptions['createView'];
}

/**
 * Thin JSON app entry: shell ViewPort + JsonPlugin workspace + getText/setText.
 */
export class Editor extends SharedEditor {
  constructor(host: HTMLElement, options: EditorOptions = {}) {
    const shared: SharedEditorOptions = {
      ...options,
      doc: options.doc ?? emptyEditorDoc(null),
      createView: options.createView ?? createShellView,
      plugins: options.plugins ?? createDefaultPlugins({ toolbar: options.toolbar }),
    };
    super(host, shared);
  }

  /** Plain JSON (interchange; not EditorAPI). Default indent from `json` root attrs. */
  getText(indent?: number | string): string {
    const doc = this.getState().doc;
    return serializeText(docToValue(doc), indent === undefined ? indentFromDoc(doc) : indent);
  }

  /**
   * Parse plain JSON into SoT. Invalid text → ParseError, SoT unchanged.
   */
  setText(text: string): ParseError | null {
    const result = parseText(text, indentFromDoc(this.getState().doc));
    if (!result.ok) {
      return result.error;
    }
    this.replaceDocument(result.doc);
    return null;
  }

  private accepts(tr: Transaction): boolean {
    const { state } = applyTransaction(this.getState(), tr, this.schema);
    return isJsonEditorDoc(state.doc);
  }

  private assertJsonDoc(json: JSONDoc | DocNode): DocNode {
    const doc = docFromJSON(json);
    if (!isJsonEditorDoc(doc)) {
      throw new TypeError('JSON Editor document must be doc with a single json child');
    }
    return doc;
  }

  override setJSON(json: JSONDoc | DocNode): void {
    super.setJSON(this.assertJsonDoc(json));
  }

  override replaceDocument(json: JSONDoc | DocNode): void {
    super.replaceDocument(this.assertJsonDoc(json));
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
