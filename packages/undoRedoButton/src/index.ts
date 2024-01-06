import { EditorCore, IEditorModule } from "@/index";

export class UndoRedoButtonPlugin implements IEditorModule {
  initialize(core: EditorCore): void {
    const createUndoButton = () => {
      const button = document.createElement('button');
      button.classList.add('on-codemerge-button');
      button.textContent = 'Undo';
      button.disabled = true;
      button.addEventListener('click', () => {
        core.undo()
      });
      return button;
    };

    const createRedoButton = () => {
      const button = document.createElement('button');
      button.classList.add('on-codemerge-button');
      button.textContent = 'Redo';
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

    core.subscribeToContentChange((newContent: string) => {
      console.log(core.isUndo(), core.isRedo())
      undo.disabled = !core.isUndo();
      redo.disabled = !core.isRedo();
    });
  }
}

export default UndoRedoButtonPlugin;
