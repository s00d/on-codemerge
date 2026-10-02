import { Editor as SharedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import { applyTransaction, docFromJSON } from '@codemerge/kernel';
import type { Command, DocNode, JSONDoc, Transaction } from '@codemerge/kernel';
import type { PluginDefinition } from '@codemerge/sdk';
import type { Translations } from '@i18n-micro/runtime';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isChartEditorDoc,
  parseText,
  serializeText,
  attrsFromDoc,
} from '../../../../plugins/ChartsPlugin';
import type { ChartToolbarOptions, ParseError, ChartAttrs } from '../../../../plugins/ChartsPlugin';

export interface EditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  locale?: string;
  fallbackLocale?: string;
  messages?: Record<string, Translations>;
  colorScheme?: 'host' | 'system';
  chrome?: 'bar' | 'page';
  toolbar?: ChartToolbarOptions;
  createView?: SharedEditorOptions['createView'];
}

/**
 * Thin Charts app entry: shell ViewPort + ChartsPlugin workspace + getText/setText.
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

  getJSONConfig(): ChartAttrs {
    return attrsFromDoc(this.getState().doc);
  }

  setJSONConfig(attrs: ChartAttrs): void {
    this.replaceDocument(emptyEditorDoc(attrs));
  }

  private accepts(tr: Transaction): boolean {
    const { state } = applyTransaction(this.getState(), tr, this.schema);
    return isChartEditorDoc(state.doc);
  }

  private assertChartDoc(json: JSONDoc | DocNode): DocNode {
    const doc = docFromJSON(json);
    if (!isChartEditorDoc(doc)) {
      throw new TypeError('Charts Editor document must be doc with a single chart child');
    }
    return doc;
  }

  override setJSON(json: JSONDoc | DocNode): void {
    super.setJSON(this.assertChartDoc(json));
  }

  override replaceDocument(json: JSONDoc | DocNode): void {
    super.replaceDocument(this.assertChartDoc(json));
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
