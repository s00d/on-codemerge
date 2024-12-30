import { PopupManager } from '../../../core/ui/PopupManager';
import type { FileUploader } from '../services/FileUploader';
import { uploadMessageIcon } from '../../../icons';
import type { HTMLEditor } from '../../../core/HTMLEditor.ts';
import type { UploadConfig } from '../config/UploadConfig.ts';

export class FileUploadMenu {
  private editor: HTMLEditor;
  private popup: PopupManager;
  private uploader: FileUploader;
  private config: Partial<UploadConfig>;
  private onUpload: ((file: { id: string; name: string; size: number }) => void) | null = null;
  private dragCounter = 0;

  // Ссылки на элементы
  private uploadArea: HTMLElement | null = null;
  private uploadMessage: HTMLElement | null = null;
  private uploadProgress: HTMLElement | null = null;
  private progressFill: HTMLElement | null = null;
  private filename: HTMLElement | null = null;

  constructor(editor: HTMLEditor, uploader: FileUploader, config: Partial<UploadConfig>) {
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
    const container = document.createElement('div');
    container.className = 'p-4';

    // Область для загрузки файлов
    this.uploadArea = document.createElement('div');
    this.uploadArea.className =
      'upload-area border-2 border-dashed border-gray-300 rounded-lg p-8 text-center';

    // Сообщение для загрузки
    this.uploadMessage = document.createElement('div');
    this.uploadMessage.className = 'upload-message';

    // Иконка загрузки (вставляем напрямую)
    this.uploadMessage.insertAdjacentHTML('afterbegin', uploadMessageIcon);

    // Текст сообщения
    const messageText = document.createElement('p');
    messageText.className = 'mt-2 text-sm text-gray-600';
    messageText.innerHTML = `
    ${this.editor.t('Drag and drop your file here, or')}
    <button type="button" class="browse-button text-blue-500 hover:text-blue-700">
      ${this.editor.t('browse')}
    </button>
  `;
    this.uploadMessage.appendChild(messageText);

    // Информация о максимальном размере файла
    const sizeInfo = document.createElement('p');
    sizeInfo.className = 'mt-1 text-xs text-gray-500';
    sizeInfo.textContent =
      this.editor.t('Maximum file size: ') +
      this.uploader.formatFileSize(this.config.maxFileSize ?? 10 * 1024 * 1024);
    this.uploadMessage.appendChild(sizeInfo);

    // Прогресс загрузки
    this.uploadProgress = document.createElement('div');
    this.uploadProgress.className = 'upload-progress hidden';

    // Прогресс-бар
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar h-2 bg-gray-200 rounded-full overflow-hidden';

    this.progressFill = document.createElement('div');
    this.progressFill.className = 'progress-fill h-full bg-blue-500 transition-all duration-300';
    this.progressFill.style.width = '0%';
    progressBar.appendChild(this.progressFill);

    this.uploadProgress.appendChild(progressBar);

    // Текст с именем файла
    this.filename = document.createElement('p');
    this.filename.className = 'mt-2 text-sm text-gray-600';
    this.filename.innerHTML = `${this.editor.t('Uploading')} <span class="filename"></span>...`;
    this.uploadProgress.appendChild(this.filename);

    // Поле для выбора файла
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
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

    // Handle drag and drop
    uploadArea.addEventListener('dragenter', (e) => {
      e.preventDefault();
      this.dragCounter++;
      uploadArea.classList.add('border-blue-500', 'bg-blue-50');
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.dragCounter--;
      if (this.dragCounter === 0) {
        uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
      }
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    uploadArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      this.dragCounter = 0;
      uploadArea.classList.remove('border-blue-500', 'bg-blue-50');

      const file = (e as DragEvent).dataTransfer?.files[0];
      if (file) {
        await this.handleFileUpload(file);
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
  }

  public show(onUpload: (file: { id: string; name: string; size: number }) => void): void {
    this.onUpload = onUpload;

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
      this.uploadArea.removeEventListener('dragenter', () => {});
      this.uploadArea.removeEventListener('dragleave', () => {});
      this.uploadArea.removeEventListener('dragover', () => {});
      this.uploadArea.removeEventListener('drop', () => {});
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
