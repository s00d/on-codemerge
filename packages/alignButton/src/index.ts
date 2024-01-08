import type { EditorCore, IEditorModule } from "@/index";
import { DropdownMenu } from "@root/helpers/dropdownMenu";

export class AlignButton implements IEditorModule {
  private dropdown: DropdownMenu;

  constructor() {
    this.dropdown = new DropdownMenu('Align')
  }

  initialize(core: EditorCore): void {
    const alignButtons = [
      { align: 'left', text: 'Left' },
      { align: 'right', text: 'Right' },
      { align: 'center', text: 'Center' },
      { align: 'justify', text: 'Justify' }
    ];

    alignButtons.forEach(({ align, text }) => {
      this.dropdown.addItem(text, () => this.applyAlignment(core, align))
    });

    core.popup.addHtmlItem(this.dropdown.getButton());
  }

  private applyAlignment(core: EditorCore, align: string): void {
    core.restoreCurrentSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Найти или создать элемент для применения стиля выравнивания
    const element = container.nodeType === 3 ? container.parentNode : container;
    if (element && element.nodeType === 1) {
      (element as HTMLElement).style.textAlign = align;
      const editor = core.editor.getEditorElement();
      if(editor) core.setContent(editor.innerHTML); // Обновить состояние редактора
    }
  }
}

export default AlignButton;
