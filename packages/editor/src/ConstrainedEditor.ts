import { applyTransaction, docFromJSON } from '@codemerge/kernel';
import type { Command, DocNode, JSONDoc, Transaction } from '@codemerge/kernel';
import { Editor } from './Editor';

/** Shell product editors: SoT shape is fixed; reject transactions that break it. */
export abstract class ConstrainedEditor extends Editor {
  protected abstract isConstrainedDoc(doc: DocNode): boolean;
  protected abstract constrainedDocError(): string;

  private assertConstrained(json: JSONDoc | DocNode): DocNode {
    const doc = docFromJSON(json);
    if (!this.isConstrainedDoc(doc)) {
      throw new TypeError(this.constrainedDocError());
    }
    return doc;
  }

  override setJSON(json: JSONDoc | DocNode): void {
    super.setJSON(this.assertConstrained(json));
  }

  override replaceDocument(json: JSONDoc | DocNode): void {
    super.replaceDocument(this.assertConstrained(json));
  }

  override dispatch(tr: Transaction): void {
    const onlySelection = tr.ops.length > 0 && tr.ops.every((o) => o.type === 'set_selection');
    if (!onlySelection) {
      const { state } = applyTransaction(this.getState(), tr, this.schema);
      if (!this.isConstrainedDoc(state.doc)) {
        return;
      }
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
