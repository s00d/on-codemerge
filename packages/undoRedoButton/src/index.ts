import type { EditorCore, IEditorModule } from "@/index";
import rotateCcw from "../../../icons/rotate-ccw.svg";
import rotateCw from "../../../icons/rotate-cw.svg";

export class UndoRedoButton implements IEditorModule {
  initialize(core: EditorCore): void {
    const createUndoButton = () => {
      const button = document.createElement('button');
      button.classList.add('on-codemerge-button');
      button.innerHTML = rotateCcw;
      button.title = 'Undo';
      button.disabled = true;
      button.addEventListener('click', () => {
        core.undo()
      });
      return button;
    };

    const createRedoButton = () => {
      const button = document.createElement('button');
      button.classList.add('on-codemerge-button');
      button.innerHTML = rotateCw;
      button.title = 'Redo';
      button.disabled = true;
      button.addEventListener('click', () => {
        core.redo()
      });
      return button;
    };

    // Получаем панель инструментов и попап
    const toolbar = core.toolbar.getToolbarElement();

    const undo = createUndoButton()
    const redo = createRedoButton()

    // Добавляем кнопку на панель инструментов и в попап
    if(toolbar) toolbar.appendChild(undo);
    if(toolbar) toolbar.appendChild(redo);

    core.subscribeToContentChange(() => {
      undo.disabled = !core.isUndo();
      redo.disabled = !core.isRedo();
    });
  }
}

export default UndoRedoButton;
