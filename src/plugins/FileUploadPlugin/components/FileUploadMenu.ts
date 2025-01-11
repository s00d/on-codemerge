import { PopupManager } from '../../../core/ui/PopupManager';
import type { FileUploader } from '../services/FileUploader';
import { uploadMessageIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import type { UploadConfig } from '../config/UploadConfig.ts';
import { createContainer, createInputField, createP } from '../../../utils/helpers.ts';

export class FileUploadMenu {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private uploader: FileUploader;
  private config: Partial<UploadConfig>;
  private onUpload: ((file: { id: string; name: string; size: number }) => void) | null = null;

  // Ссылки на элементы
  private uploadArea: HTMLElement | null = null;
  private uploadMessage: HTMLElement | null = null;
  private uploadProgress: HTMLElement | null = null;
  private progressFill: HTMLElement | null = null;
  private filename: HTMLElement | null = null;

  constructor(editor: HTMLEditor, uploader: FileUploader, config: Partial<UploadConfig>, onUpload: (file: { id: string; name: string; size: number }) => void) {
    this.onUpload = onUpload;
    this.editor = editor;
    this.uploader = uploader;
    this.config = config;
    this.popup = new PopupManager(editor, {
      title: 'Upload File',
      className: 'file-upload-menu',
      closeOnClickOutside: true,
      buttons: [
        {
          label: editor.t('Cancel'),
          variant: 'secondary',
          onClick: () => this.popup.hide(),
        },
      ],
      items: [
        {
          type: 'custom',
          id: 'upload-content',
          content: () => this.createUploadContent(),
        },
      ],
    });
  }

  private createUploadContent(): HTMLElement {
    // Основной контейнер
    const container = createContainer('p-4');
    this.uploadArea = createContainer(
      'upload-area border-2 border-dashed border-gray-300 rounded-lg p-8 text-center'
    );
    this.uploadMessage = createContainer('upload-message');
    this.uploadMessage.insertAdjacentHTML('afterbegin', uploadMessageIcon);

    // Текст сообщения
    const messageText = createP('p');
    messageText.className = 'mt-2 text-sm text-gray-600';
    messageText.innerHTML = `
    ${this.editor.t('Drag and drop your file here, or')}
    <button type="button" class="browse-button text-blue-500 hover:text-blue-700">
      ${this.editor.t('browse')}
    </button>
  `;
    this.uploadMessage.appendChild(messageText);

    // Информация о максимальном размере файла
    const sizeInfo = createP(
      'mt-1 text-xs text-gray-500',
      this.editor.t('Maximum file size: ') +
        this.uploader.formatFileSize(this.config.maxFileSize ?? 10 * 1024 * 1024)
    );
    this.uploadMessage.appendChild(sizeInfo);

    // Прогресс загрузки
    this.uploadProgress = createContainer('upload-progress hidden');
    const progressBar = createContainer(
      'progress-bar h-2 bg-gray-200 rounded-full overflow-hidden'
    );
    this.progressFill = createContainer(
      'progress-fill h-full bg-blue-500 transition-all duration-300'
    );
    this.progressFill.style.width = '0%';
    progressBar.appendChild(this.progressFill);

    this.uploadProgress.appendChild(progressBar);

    // Текст с именем файла
    this.filename = createP(
      'mt-2 text-sm text-gray-600',
      `${this.editor.t('Uploading')} <span class="filename"></span>...`
    );
    this.uploadProgress.appendChild(this.filename);

    // Поле для выбора файла
    const fileInput = createInputField('file');
    fileInput.className = 'hidden';

    // Сборка структуры
    this.uploadArea.appendChild(this.uploadMessage);
    this.uploadArea.appendChild(this.uploadProgress);
    container.appendChild(this.uploadArea);
    container.appendChild(fileInput);

    // Настройка обработчиков событий
    this.setupEventListeners(this.uploadArea, fileInput);

    return container;
  }

  private setupEventListeners(uploadArea: HTMLElement, fileInput: HTMLInputElement): void {
    const browseButton = uploadArea.querySelector('.browse-button')!;


    this.editor.on('file-drop', async (e: { type: string; name: string; content: string | ArrayBuffer }) => {
      if (!e.type.startsWith('image/')) {
        this.editor?.ensureEditorFocus();

        // Если content является файлом (например, объект File)
        if (e.content instanceof File) {
          await this.handleFileUpload(e.content);
        }
        // Если content является ArrayBuffer (например, бинарные данные)
        else if (e.content instanceof ArrayBuffer) {
          // Создаем файл из ArrayBuffer
          const file = new File([e.content], e.name, { type: e.type });
          await this.handleFileUpload(file);
        }
        // Если content является строкой (например, текстовые данные)
        else if (typeof e.content === 'string') {
          // Создаем файл из строки
          const file = new File([e.content], e.name, { type: 'text/plain' });
          await this.handleFileUpload(file);
        }
      }
    });

    // Handle file input
    browseButton.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (file) {
        await this.handleFileUpload(file);
        // Reset file input
        fileInput.value = '';
      }
    });
  }

  private async handleFileUpload(file: File): Promise<void> {
    this.popup.show()
    setTimeout(async () => {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        alert(
          this.editor.t('File size exceeds 10MB limit', {
            max: this.uploader.formatFileSize(this.config.maxFileSize ?? 10 * 1024 * 1024),
          })
        );
        return;
      }

      if (!this.uploadMessage || !this.uploadProgress || !this.progressFill || !this.filename) {
        console.error('UI elements are not initialized');
        return;
      }

      // Show progress UI
      this.uploadMessage.classList.add('hidden');
      this.uploadProgress.classList.remove('hidden');
      this.filename.textContent = file.name;

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress = Math.min(95, progress + 5);
        this.progressFill!.style.width = `${progress}%`;
      }, 50);

      try {
        const uploadedFile = await this.uploader.uploadFile(file);

        // Complete progress
        clearInterval(interval);
        this.progressFill!.style.width = '100%';

        await new Promise((resolve) => setTimeout(resolve, 500));

        if (this.onUpload) {
          this.onUpload(uploadedFile);
        }

        this.popup.hide();

        // Reset UI after a short delay
        setTimeout(() => {
          this.uploadMessage!.classList.remove('hidden');
          this.uploadProgress!.classList.add('hidden');
          this.progressFill!.style.width = '0%';
        }, 300);
      } catch (error) {
        clearInterval(interval);
        alert(this.editor.t('Upload failed. Please try again.'));

        // Reset UI
        this.uploadMessage!.classList.remove('hidden');
        this.uploadProgress!.classList.add('hidden');
        this.progressFill!.style.width = '0%';
      }
    }, 100)
  }

  public show(): void {
    // Reset UI state
    if (this.uploadMessage && this.uploadProgress && this.progressFill) {
      this.uploadMessage.classList.remove('hidden');
      this.uploadProgress.classList.add('hidden');
      this.progressFill.style.width = '0%';
    }

    this.popup.show();
  }

  public destroy(): void {
    // Скрываем попап, если он открыт
    this.popup.hide();

    // Очищаем обработчики событий
    if (this.uploadArea) {
      this.editor.off('drag-enter');
      this.editor.off('drag-leave');
      this.editor.off('drop');
    }

    // Очищаем ссылки на элементы
    this.uploadArea = null;
    this.uploadMessage = null;
    this.uploadProgress = null;
    this.progressFill = null;
    this.filename = null;

    // Очищаем ссылки на объекты
    this.editor = null!;
    this.uploader = null!;
    this.popup = null!;
    this.onUpload = null;
  }
}
