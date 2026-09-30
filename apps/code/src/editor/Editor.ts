import { Editor as SharedEditor, createShellView } from '@codemerge/editor';
import type { SharedEditorOptions } from '@codemerge/editor';
import { applyTransaction, docFromJSON } from '@codemerge/kernel';
import type { Command, DocNode, JSONDoc, Transaction } from '@codemerge/kernel';
import type { PluginDefinition } from '@codemerge/sdk';
import type { Translations } from '@i18n-micro/runtime';
import {
  createDefaultPlugins,
  emptyEditorDoc,
  isCodeEditorDoc,
  languageFromDoc,
  parseText,
  serializeText,
} from '../../../../plugins/CodeBlockPlugin';
import type { CodeToolbarOptions, ParseError } from '../../../../plugins/CodeBlockPlugin';
import { codeWorkspaceByEditor } from '../../../../plugins/CodeBlockPlugin/surface/workspaceView';

/** Code entry construct bag — `createView` optional (defaults shell ViewPort). */
export interface EditorOptions {
  plugins?: PluginDefinition[];
  doc?: DocNode | JSONDoc;
  history?: { maxDepth?: number; mergeWindowMs?: number };
  locale?: string;
  fallbackLocale?: string;
  messages?: Record<string, Translations>;
  colorScheme?: 'host' | 'system';
  chrome?: 'bar' | 'page';
  /** Declarative toolbar menus / items (passed to CodeBlockPlugin workspace). */
  toolbar?: CodeToolbarOptions;
  /** Override default shell ViewPort (advanced hosts). */
  createView?: SharedEditorOptions['createView'];
}

/**
 * Thin Code app entry: shell ViewPort + CodeBlockPlugin workspace + getText/setText.
 */
export class Editor extends SharedEditor {
  constructor(host: HTMLElement, options: EditorOptions = {}) {
    const shared: SharedEditorOptions = {
      ...options,
      doc: options.doc ?? emptyEditorDoc(''),
      createView: options.createView ?? createShellView,
      plugins: options.plugins ?? createDefaultPlugins({ toolbar: options.toolbar }),
    };
    super(host, shared);
  }

  /** Plain source text (interchange). Flushes pending workspace debounce first. */
  getText(): string {
    codeWorkspaceByEditor.get(this)?.flushPendingSoT();
    return serializeText(this.getState().doc);
  }

  /**
   * Replace SoT with plain text. Oversized → ParseError, SoT unchanged.
   */
  setText(text: string): ParseError | null {
    const result = parseText(text, languageFromDoc(this.getState().doc));
    if (!result.ok) {
      return result.error;
    }
    this.replaceDocument(result.doc);
    return null;
  }

  private accepts(tr: Transaction): boolean {
    const { state } = applyTransaction(this.getState(), tr, this.schema);
    return isCodeEditorDoc(state.doc);
  }

  private assertCodeDoc(json: JSONDoc | DocNode): DocNode {
    const doc = docFromJSON(json);
    if (!isCodeEditorDoc(doc)) {
      throw new TypeError('Code Editor document must be doc with a single code_source child');
    }
    return doc;
  }

  override setJSON(json: JSONDoc | DocNode): void {
    super.setJSON(this.assertCodeDoc(json));
  }

  override replaceDocument(json: JSONDoc | DocNode): void {
    super.replaceDocument(this.assertCodeDoc(json));
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
