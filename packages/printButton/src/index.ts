import { printer } from "../../../src/icons";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";

export class PrintButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private button: HTMLDivElement | null = null;

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    // Добавляем кнопку для печати
    this.button = core.toolbar.addButtonIcon('Print', printer, this.printContent.bind(this));

    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Print');
  }

  private printContent(): void {
    if (!this.core) return;

    const editor = this.core.editor.getEditorElement()
    if (!editor) return;
    const editorContent = editor.innerHTML ?? '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Print</title></head><body>');
    printWindow.document.write(editorContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }

  destroy(): void {
    // Cleanup any resources or event listeners here
    this.core = null;

    this.button?.removeEventListener('click', this.printContent);
    this.button = null;
  }
}

export default PrintButton;
