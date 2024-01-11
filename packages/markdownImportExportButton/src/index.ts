import type { EditorCore } from "@/index";
import { terminal } from "../../../src/icons";
import type { IEditorModule } from "@/types";
import TurndownService from 'turndown';
import Showdown from 'showdown';
import { Modal } from "../../../helpers/modal";


export class MarkdownImportExportButton implements IEditorModule {
  private core: EditorCore | null = null;
  private turndownService = new TurndownService();
  private showdownConverter = new Showdown.Converter();
  private modal: Modal | null = null;

  initialize(core: EditorCore): void {
    this.core = core;
    core.toolbar.addButtonIcon('Markdown', terminal, () => this.toMarkdown());
    this.modal = new Modal(core, '600px');
  }

  private toMarkdown(): void {
    if (!this.core) return;

    const htmlContent = this.core.getContent();
    const markdown = this.turndownService.turndown(htmlContent);
    // Пример вставки Markdown - здесь можно использовать диалоговое окно или форму ввода
    this.modal?.open([
      { type: 'textarea', value: markdown, rows: 20, label: 'Markdown', hideLabel: true }
    ], (data) => {
      const markdown = data.Markdown as string;
      if (markdown) {
        const htmlContent = this.showdownConverter.makeHtml(markdown);
        this.core?.setContent(htmlContent);
      }
    }, 'Markdown');
  }

  destroy(): void {
    // Cleanup any resources or event listeners here
    if (this.modal) {
      this.modal.destroy();
      this.modal = null;
    }
    this.core = null;
  }
}

export default MarkdownImportExportButton;
