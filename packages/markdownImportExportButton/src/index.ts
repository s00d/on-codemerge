import { terminal } from "../../../src/icons";
import TurndownService from 'turndown';
import Showdown from 'showdown';
import { Modal } from "../../../helpers/modal";
import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";


export class MarkdownImportExportButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private turndownService = new TurndownService();
  private showdownConverter = new Showdown.Converter();
  private modal: Modal | null = null;
  private button: HTMLDivElement | null = null;

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.button = core.toolbar.addButtonIcon('Markdown', terminal, this.toMarkdown.bind(this));
    this.modal = new Modal(core, '600px');

    core.i18n.addObserver(this);
  }

  update(): void {
    if(this.button) this.button.title = this.core!.i18n.translate('Markdown');
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


    this.button?.removeEventListener('click', this.toMarkdown)
    this.button = null;
  }
}

export default MarkdownImportExportButton;
