import type { EditorCore } from "@/index";
import { printer } from "../../../src/icons";
import type { IEditorModule } from "@/types";

export class PrintButton implements IEditorModule {
  private core: EditorCore | null = null;

  initialize(core: EditorCore): void {
    this.core = core;
    // Добавляем кнопку для печати
    core.toolbar.addButtonIcon('Print', printer, () => this.printContent());
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
  }
}

export default PrintButton;
