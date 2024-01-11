import type { EditorCore } from "@/index";
import { eye } from "../../../src/icons";
import type { IEditorModule } from "@/types";

export class PreviewButton implements IEditorModule {
  private core: EditorCore | null = null;
  private modal: HTMLDivElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private previewContainer: HTMLDivElement | null = null;

  initialize(core: EditorCore): void {
    this.core = core;
    this.injectStyles();

    // Создаем кнопку на панели инструментов
    core.toolbar.addButtonIcon('Preview', eye, () => this.openModal());

    // Создаем модальное окно для предпросмотра
    this.createModal();
  }

  private createModal(): void {
    this.modal = document.createElement('div');
    this.modal.classList.add('html-preview-modal');
    this.modal.style.display = 'none';

    // Создание оверлея
    this.overlay = document.createElement('div');
    this.overlay.classList.add('modal-overlay');
    this.overlay.style.display = 'none';
    this.overlay.onclick = () => this.closeModal(); // Закрытие при клике на оверлей

    // Создание кнопки закрытия
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.classList.add('modal-close-button');
    closeButton.onclick = () => this.closeModal();

    // Создание контейнера для предпросмотра
    this.previewContainer = document.createElement('div');
    this.previewContainer.classList.add('preview-container');

    this.modal.appendChild(closeButton);
    this.modal.appendChild(this.previewContainer);
    this.core?.generalElement.appendChild(this.modal);
    this.core?.generalElement.appendChild(this.overlay);
  }

  private openModal(): void {
    if(this.modal && this.core) {
      this.modal.style.display = 'block';
      if(this.overlay) this.overlay.style.display = 'block';
      if (this.previewContainer) this.previewContainer.innerHTML = this.core.getContent();
    }
  }

  private closeModal(): void {
    if(this.modal) {
      this.modal.style.display = 'none';
      if(this.overlay) this.overlay.style.display = 'none';
    }
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      .html-preview-modal {
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
      .preview-container {
        width: 100%;
        height: 100%;
        overflow: auto;
            border-top: 1px solid #cccccc;
    padding: 5px;
      }
    `;
    document.head.appendChild(style);
  }

  destroy(): void {
    // Cleanup any resources or event listeners here
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.previewContainer) {
      this.previewContainer = null;
    }
    this.core = null;
  }
}

export default PreviewButton;
