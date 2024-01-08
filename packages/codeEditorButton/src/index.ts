import type { EditorCore, IEditorModule } from "@/index";

import { EditorView, basicSetup } from "codemirror"
import { html } from "@codemirror/lang-html"

export class CodeEditorButton implements IEditorModule {
  private core: EditorCore | null = null;
  private editor: EditorView | null = null;
  private modal: HTMLDivElement | null = null;
  private overlay: HTMLDivElement | null = null;

  initialize(core: EditorCore): void {
    this.core = core;
    this.injectStyles();

    // Создаем кнопку на панели инструментов
    core.toolbar.addButton('HTML', () => this.openModal());

    // Создаем модальное окно
    this.createModal();
  }

  private createModal(): void {
    this.modal = document.createElement('div');
    this.modal.classList.add('code-editor-modal');
    this.modal.style.display = 'none';

    // Создание оверлея
    this.overlay = document.createElement('div');
    this.overlay.classList.add('modal-overlay');
    this.overlay.style.display = 'none';

    // Создание кнопки закрытия
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('modal-close-button');
    closeButton.onclick = () => this.closeModal();

    const textblock = document.createElement('div');
    this.modal.appendChild(textblock);
    this.modal.appendChild(closeButton); // Добавляем кнопку закрытия в модальное окно
    this.core?.generalElement.appendChild(this.modal);
    this.core?.generalElement.appendChild(this.overlay);

    this.editor = new EditorView({
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        EditorView.theme({}, { dark: true }),
        html(),
      ],
      parent: textblock,
      doc: this.core?.getContent() ?? '',
    });
    this.editor.lineWrapping
  }

  formatHtml(html: string) {
    // Простой пример форматирования: добавление переноса строки после каждого закрывающего тега
    return html.replace(/>\s*</g, '>\n<');
  }

  private openModal(): void {
    if(this.modal && this.core) {
      this.modal.style.display = 'block';
      if(this.overlay) this.overlay.style.display = 'block';

      this.editor?.dispatch({
        changes: { from: 0, to: this.editor?.state.doc.length, insert: this.formatHtml(this.core?.getContent() ?? '') }
      });
    }
  }

  private closeModal(): void {
    if(this.modal && this.core && this.editor) {
      this.modal.style.display = 'none';
      if(this.overlay) this.overlay.style.display = 'none';
      this.core.setContent(this.editor?.state.doc.toString());
    }
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      .code-editor-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        height: 300px;
        overflow: scroll;
        background: white;
        border: 1px solid #ccc;
        padding: 40px 0 0;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: none;
      }
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
      }
      .modal-close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        border: none;
        background: none;
        font-size: 20px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
}

export default CodeEditorButton;
