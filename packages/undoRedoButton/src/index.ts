import { rotateCcw, rotateCw } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class UndoRedoButton implements IEditorModule, Observer {
  private undo: HTMLDivElement | null = null;
  private redo: HTMLDivElement | null = null;
  private core: EditorCoreInterface | null = null;
  initialize(core: EditorCoreInterface): void {
    this.core = core
    const createUndoButton = () => {
      const button = document.createElement('div');
      button.classList.add('on-codemerge-button');
      button.classList.add('disabled');
      button.innerHTML = rotateCcw;
      button.title = 'Undo';
      button.addEventListener('click', this.handleUndoClick.bind(this));
      return button;
    };

    const createRedoButton = () => {
      const button = document.createElement('div');
      button.classList.add('on-codemerge-button');
      button.innerHTML = rotateCw;
      button.title = 'Redo';
      button.classList.add('disabled');
      button.addEventListener('click', this.handleRedoClick.bind(this));
      return button;
    };

    // Получаем панель инструментов и попап
    const toolbar = core.toolbar.getToolbarElement();

    this.undo = createUndoButton()
    this.redo = createRedoButton()

    // Добавляем кнопку на панель инструментов и в попап
    if(toolbar) toolbar.appendChild(this.undo);
    if(toolbar) toolbar.appendChild(this.redo);

    core.subscribeToContentChange(() => {
      if(this.undo) {
        if (core.isUndo()) {
          this.undo.classList.remove('disabled')
        } else {
          this.undo.classList.add('disabled')
        }
      }
      if(this.redo) {
        if (core.isRedo()) {
          this.redo.classList.remove('disabled')
        } else {
          this.redo.classList.add('disabled')
        }
      }
    });

    core.i18n.addObserver(this);
  }


  update(): void {
    if(this.undo) this.undo.title = this.core!.i18n.translate('Undo')
    if(this.redo) this.redo.title = this.core!.i18n.translate('Redo')
  }

  private handleUndoClick() {
    this.core?.undo();
  }

  private handleRedoClick() {
    this.core?.redo();
  }

  destroy(): void {
    // Remove event listeners and references to DOM elements to prevent memory leaks
    if (this.undo) {
      this.undo.removeEventListener('click', this.handleUndoClick);
      this.undo = null;
    }
    if (this.redo) {
      this.redo.removeEventListener('click', this.handleRedoClick);
      this.redo = null;
    }
  }
}

export default UndoRedoButton;
