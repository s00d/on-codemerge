import type { EditorState, Mark, Transaction } from '@on-codemerge/kernel';
import {
  collapsedAt,
  deleteBackward,
  deleteForward,
  insertText,
  runCommand,
  softDeleteBackward,
  splitBlock,
  toggleMark,
  transaction,
} from '@on-codemerge/kernel';
import { pathFromAtomEl, selectionFromDom } from './EditorView';

export type Dispatch = (tr: Transaction) => void;
export { transaction };

export type InputMarksProvider = () => {
  storedMarks: Mark[];
  softDelete: Mark | null;
};

function pathsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((n, i) => n === b[i]);
}

/**
 * Maps DOM beforeinput/click/selection to kernel transactions.
 */
export class InputBridge {
  private disposed = false;
  private suppressSelectionUntil = 0;
  /** When true, mouseup must not overwrite atom selection with a null DOM range. */
  private atomSelectionPinned = false;

  constructor(
    private readonly content: HTMLElement,
    private readonly getState: () => EditorState,
    private readonly dispatch: Dispatch,
    private readonly isSelectionSyncPaused: () => boolean = () => false,
    private readonly getInputMarks: InputMarksProvider = () => ({
      storedMarks: [],
      softDelete: null,
    })
  ) {
    this.content.addEventListener('beforeinput', this.onBeforeInput);
    this.content.addEventListener('keydown', this.onKeyDown);
    this.content.addEventListener('mousedown', this.onMouseDown);
    this.content.addEventListener('mouseup', this.onMouseUp);
    this.content.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('selectionchange', this.onSelectionChange);
  }

  destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.content.removeEventListener('beforeinput', this.onBeforeInput);
    this.content.removeEventListener('keydown', this.onKeyDown);
    this.content.removeEventListener('mousedown', this.onMouseDown);
    this.content.removeEventListener('mouseup', this.onMouseUp);
    this.content.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('selectionchange', this.onSelectionChange);
  }

  private syncSelectionFromDom(): void {
    if (this.isSelectionSyncPaused()) {
      return;
    }
    if (Date.now() < this.suppressSelectionUntil) {
      return;
    }
    const sel = selectionFromDom(this.content);
    if (!sel) {
      return;
    }
    const state = this.getState();
    const same =
      pathsEqual(state.selection.anchor.path, sel.anchor.path) &&
      state.selection.anchor.offset === sel.anchor.offset &&
      pathsEqual(state.selection.focus.path, sel.focus.path) &&
      state.selection.focus.offset === sel.focus.offset;
    if (same) {
      return;
    }
    this.dispatch(transaction({ selection: sel, type: 'set_selection' }));
  }

  private selectAtom(atomHost: HTMLElement): void {
    const path = pathFromAtomEl(atomHost);
    const sel = {
      anchor: { path, offset: 0 },
      focus: { path, offset: 0 },
    };
    const state = this.getState();
    if (
      pathsEqual(state.selection.anchor.path, path) &&
      state.selection.anchor.offset === 0 &&
      pathsEqual(state.selection.focus.path, path)
    ) {
      this.atomSelectionPinned = true;
      return;
    }
    this.atomSelectionPinned = true;
    this.dispatch(transaction({ selection: sel, type: 'set_selection' }));
  }

  private readonly onMouseDown = (e: MouseEvent): void => {
    // Preserve dblclick / drag selection — don't sync mid-gesture.
    this.suppressSelectionUntil = Date.now() + 320;
    this.atomSelectionPinned = false;
    const t = e.target;
    if (!(t instanceof Element)) {
      return;
    }
    const atom = t.closest('[data-ocm-atom="1"]');
    if (atom instanceof HTMLElement && this.content.contains(atom)) {
      // contenteditable=false atoms often leave native Selection empty —
      // pin kernel selection so toolbar commands (align, …) hit this atom.
      this.selectAtom(atom);
    }
  };

  private readonly onContextMenu = (e: MouseEvent): void => {
    const t = e.target;
    if (!(t instanceof Element)) {
      return;
    }
    const atom = t.closest('[data-ocm-atom="1"]');
    if (atom instanceof HTMLElement && this.content.contains(atom)) {
      this.selectAtom(atom);
    }
  };

  private readonly onMouseUp = (): void => {
    this.suppressSelectionUntil = 0;
    if (this.atomSelectionPinned) {
      this.atomSelectionPinned = false;
      return;
    }
    this.syncSelectionFromDom();
  };

  private readonly onSelectionChange = (): void => {
    if (this.isSelectionSyncPaused()) {
      return;
    }
    if (this.atomSelectionPinned || Date.now() < this.suppressSelectionUntil) {
      return;
    }
    if (!this.content.contains(document.activeElement) && document.activeElement !== this.content) {
      return;
    }
    this.syncSelectionFromDom();
  };

  private readonly onBeforeInput = (e: InputEvent): void => {
    e.preventDefault();
    this.syncSelectionFromDom();
    const state = this.getState();
    const { inputType } = e;
    if (
      inputType === 'insertText' ||
      inputType === 'insertCompositionText' ||
      inputType === 'insertFromPaste' ||
      inputType === 'insertFromDrop'
    ) {
      const text = e.data ?? (e.dataTransfer ? e.dataTransfer.getData('text/plain') : '') ?? '';
      if (!text) {
        return;
      }
      const { storedMarks } = this.getInputMarks();
      const tr = runCommand(
        state,
        insertText(text, storedMarks.length > 0 ? storedMarks : undefined)
      );
      if (tr) {
        this.dispatch(tr);
      }
      return;
    }
    // Enter is handled in keydown (prevents browser default + avoids double-split with beforeinput).
    if (inputType === 'insertParagraph' || inputType === 'insertLineBreak') {
      return;
    }
    if (inputType === 'deleteContentBackward' || inputType === 'deleteContent') {
      const { softDelete } = this.getInputMarks();
      const tr = runCommand(state, softDelete ? softDeleteBackward(softDelete) : deleteBackward);
      if (tr) {
        this.dispatch(tr);
      }
      return;
    }
    if (inputType === 'deleteContentForward') {
      const tr = runCommand(state, deleteForward);
      if (tr) {
        this.dispatch(tr);
      }
    }
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      this.syncSelectionFromDom();
      const tr = runCommand(this.getState(), splitBlock);
      if (tr) {
        this.dispatch(tr);
      }
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      const state = this.getState();
      const tr = runCommand(state, toggleMark('bold'));
      if (tr) {
        this.dispatch(tr);
      }
    }
  };
}

export function selectionFromOffsets(path: number[], anchor: number, focus = anchor) {
  return {
    anchor: collapsedAt(path, anchor).anchor,
    focus: collapsedAt(path, focus).anchor,
  };
}
