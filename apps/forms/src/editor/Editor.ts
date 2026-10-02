import { Editor as SharedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import { applyTransaction, docFromJSON } from '@codemerge/kernel';
import type { Command, DocNode, JSONDoc, Transaction } from '@codemerge/kernel';
import type { PluginDefinition } from '@codemerge/sdk';
import type { Translations } from '@i18n-micro/runtime';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isFormEditorDoc,
  parseText,
  serializeText,
  configFromDoc,
} from '../../../../plugins/FormBuilderPlugin';
import type {
  FormToolbarOptions,
  ParseError,
  FormConfig,
} from '../../../../plugins/FormBuilderPlugin';

/** Forms entry construct bag — `createView` optional (defaults shell ViewPort). */
export interface EditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  locale?: string;
  fallbackLocale?: string;
  messages?: Record<string, Translations>;
  colorScheme?: 'host' | 'system';
  chrome?: 'bar' | 'page';
  toolbar?: FormToolbarOptions;
  createView?: SharedEditorOptions['createView'];
}

/**
 * Thin Forms app entry: shell ViewPort + FormBuilderPlugin workspace + getText/setText.
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

  /** Pretty FormConfig JSON. */
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

  getJSONConfig(): FormConfig {
    return configFromDoc(this.getState().doc);
  }

  setJSONConfig(config: FormConfig): void {
    this.replaceDocument(emptyEditorDoc(config));
  }

  private accepts(tr: Transaction): boolean {
    const { state } = applyTransaction(this.getState(), tr, this.schema);
    return isFormEditorDoc(state.doc);
  }

  private assertFormDoc(json: JSONDoc | DocNode): DocNode {
    const doc = docFromJSON(json);
    if (!isFormEditorDoc(doc)) {
      throw new TypeError('Forms Editor document must be doc with a single form child');
    }
    return doc;
  }

  override setJSON(json: JSONDoc | DocNode): void {
    super.setJSON(this.assertFormDoc(json));
  }

  override replaceDocument(json: JSONDoc | DocNode): void {
    super.replaceDocument(this.assertFormDoc(json));
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
