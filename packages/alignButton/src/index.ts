import { EditorCore, IEditorModule } from "@/index";

export class AlignButtonPlugin implements IEditorModule {
  initialize(core: EditorCore): void {
    const toolbar = core.toolbar.getToolbarElement();
    const popup = core.popup.getPopupElement();

    const alignButtons = [
      { align: 'left', text: 'Align Left' },
      { align: 'right', text: 'Align Right' },
      { align: 'center', text: 'Align Center' },
      { align: 'justifyFull', text: 'Justify' }
    ];

    alignButtons.forEach(({ align, text }) => {
      const createButton = () => {
        const button = document.createElement('button');
        button.classList.add('on-codemerge-button');
        button.textContent = text;
        button.addEventListener('click', () => {
          this.applyAlignment(core, align);
        });
        return button;
      }

      if (toolbar) toolbar.appendChild(createButton());
      if (popup) popup.appendChild(createButton());
    });
  }

  private applyAlignment(core: EditorCore, align: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Найти или создать элемент для применения стиля выравнивания
    let element = container.nodeType === 3 ? container.parentNode : container;
    if (element && element.nodeType === 1) {
      (element as HTMLElement).style.textAlign = align;
      const editor = core.editor.getEditorElement();
      if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора
    }
  }
}

export default AlignButtonPlugin;
