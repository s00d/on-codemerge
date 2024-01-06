import { EditorCore, IEditorModule } from "@/index";

export class TextDecorationButtonPlugin implements IEditorModule {
  initialize(core: EditorCore): void {
    this.createStyleButtons(core);
  }

  private createStyleButtons(core: EditorCore): void {
    this.createButton(core, 'Text Color', 'foreColor');
    this.createButton(core, 'Background Color', 'backColor');

    this.createFontPicker(core, 'Font');
    this.createFontSizePicker(core, 'Font Size');
  }

  private createButton(core: EditorCore, title: string, command: string): void {
    const input = document.createElement('input');
    input.type = 'color';
    input.title = title;
    input.addEventListener('input', () => {
      document.execCommand(command, false, input.value);
    });


    const popup = core.popup.getPopupElement();
    if (popup) popup.appendChild(input);
  }

  private createFontPicker(core: EditorCore, title: string): void {
    const select = document.createElement('select');
    select.title = title;
    const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
    fonts.forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      document.execCommand('fontName', false, select.value);
    });

    const popup = core.popup.getPopupElement();
    if (popup) popup.appendChild(select);
  }

  private createFontSizePicker(core: EditorCore, title: string): void {
    const input = document.createElement('input');
    input.type = 'number';
    input.title = title;
    input.value = '3';
    input.min = '1';
    input.max = '20'; // Устанавливаем разумный диапазон размеров шрифта

    let selection: any = null;
    let range: any = null;

    input.addEventListener('mousedown', () => {
      core.saveCurrentSelection()
    })

    input.addEventListener('input', () => {
      core.restoreCurrentSelection()

      // Применяем размер шрифта
      document.execCommand('fontSize', false, input.value);
    });

    const popup = core.popup.getPopupElement();
    if (popup) popup.appendChild(input);
  }
}

export default TextDecorationButtonPlugin;
