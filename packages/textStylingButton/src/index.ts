import { EditorCore, IEditorModule } from "@/index";

export class TextStylingPlugin implements IEditorModule {
  initialize(core: EditorCore): void {
    this.createButton(core, 'Bold', 'bold');
    this.createButton(core, 'Italic', 'italic');
    this.createButton(core, 'Underline', 'underline');
    this.createButton(core, 'StrikeThrough', 'strikeThrough');
    this.createButton(core, 'Superscript', 'superscript');
    this.createButton(core, 'Subscript', 'subscript');
  }

  private createButton(core: EditorCore, title: string, command: string): void {
    const button = document.createElement('button');
    button.classList.add('on-codemerge-button');
    button.textContent = title;
    button.addEventListener('click', () => {
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      document.execCommand(command, false);

      if (selection && range) {
        selection!.removeAllRanges();
        selection!.addRange(range);
      }

      core.appElement.focus(); // Возвращаем фокус в редактируемый элемент

      document.execCommand(command, false);

      core.popup.hidePopup();
    });

    const popup = core.popup.getPopupElement();
    if (popup) popup.appendChild(button);
  }
}

export default TextStylingPlugin;
