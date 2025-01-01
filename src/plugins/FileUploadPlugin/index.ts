import './style.scss';
import './public.scss';

import type { Plugin } from '../../core/Plugin';
import type { HTMLEditor } from '../../core/HTMLEditor';
import { FileUploader } from './services/FileUploader';
import { FileUploadMenu } from './components/FileUploadMenu';
import { createToolbarButton } from '../ToolbarPlugin/utils';
import type { UploadConfig } from './config/UploadConfig';
import { uploadIcon, fileIcon } from '../../icons';
import { createLink } from '../../utils/helpers.ts';

export class FileUploadPlugin implements Plugin {
  name = 'file-upload';
  private editor: HTMLEditor | null = null;
  private uploader: FileUploader;
  private menu: FileUploadMenu | null = null;
  private config: Partial<UploadConfig> = {};
  private toolbarButton: HTMLElement | null = null;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = config;
    this.uploader = new FileUploader(config);
  }

  initialize(editor: HTMLEditor): void {
    this.menu = new FileUploadMenu(editor, this.uploader, this.config);
    this.editor = editor;
    this.addToolbarButton();
    this.setupEventListeners();
    this.editor.on('file-upload', () => {
      this.editor?.ensureEditorFocus();
      this.showUploadMenu();
    });
  }

  private addToolbarButton(): void {
    const toolbar = document.querySelector('.editor-toolbar');
    if (!toolbar) return;

    this.toolbarButton = createToolbarButton({
      icon: uploadIcon,
      title: this.editor?.t('Upload File') ?? '',
      onClick: () => this.showUploadMenu(),
    });
    toolbar.appendChild(this.toolbarButton);
  }

  private setupEventListeners(): void {
    if (!this.editor) return;

    const container = this.editor.getContainer();
    container.addEventListener('click', this.handleFileLinkClick);
  }

  private handleFileLinkClick = async (e: Event): Promise<void> => {
    const fileLink = (e.target as Element).closest('.file-link');
    if (fileLink instanceof HTMLElement) {
      const fileId = fileLink.getAttribute('data-file-id');
      if (fileId) {
        try {
          await this.uploader.downloadFile(fileId);
        } catch (error) {
          console.error('Download failed:', error);
        }
      }
    }
  };

  private showUploadMenu(): void {
    this.menu?.show((file) => {
      this.insertFileLink(file);
    });
  }

  private insertFileLink(file: { id: string; name: string; size: number }): void {
    if (!this.editor) return;

    const link = createLink('');
    link.className = 'file-link';
    link.setAttribute('data-file-id', file.id);
    link.innerHTML = `
      ${fileIcon}
      ${file.name} (${this.uploader.formatFileSize(file.size)})
    `;

    this.editor?.ensureEditorFocus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(link);
      range.collapse(false);
    } else {
      this.editor.getContainer().appendChild(link);
    }
  }

  destroy(): void {
    if (this.toolbarButton && this.toolbarButton.parentElement) {
      this.toolbarButton.parentElement.removeChild(this.toolbarButton);
    }

    if (this.editor) {
      const container = this.editor.getContainer();
      container.removeEventListener('click', this.handleFileLinkClick);
    }

    this.editor?.off('file-upload', () => {
      this.editor?.ensureEditorFocus();
      this.showUploadMenu();
    });

    this.menu?.destroy();

    this.editor = null;
    this.menu = null;
    this.toolbarButton = null;
  }
}
