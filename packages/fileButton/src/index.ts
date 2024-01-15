import type { IEditorModule, Observer, EditorCoreInterface } from "../../../src/types";
import { file } from "../../../src/icons";

export class FileButton implements IEditorModule, Observer {
  private core: EditorCoreInterface | null = null;
  private button: HTMLDivElement | null = null;
  private uploadEndpoint: string = 'YOUR_UPLOAD_ENDPOINT';
  private deleteEndpoint: string = 'YOUR_DELETE_ENDPOINT';

  constructor(uploadEndpoint: string = 'YOUR_UPLOAD_ENDPOINT', deleteEndpoint: string = 'YOUR_DELETE_ENDPOINT') {
    this.uploadEndpoint = uploadEndpoint;
    this.deleteEndpoint = deleteEndpoint;
  }

  initialize(core: EditorCoreInterface): void {
    this.core = core;
    this.button = core.toolbar.addButtonIcon('File', file, this.onUploadFileClick.bind(this));
    core.i18n.addObserver(this);

    core.eventManager.subscribe('fileDrop', this.handleDragAndDropFile.bind(this));
  }

  private handleDragAndDropFile(data: { fileName: string, fileContent: string, isImage: boolean }): void {
    if (data.isImage) return;

    fetch(data.fileContent)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], data.fileName, { type: blob.type });
        this.uploadFile(file);
      })
      .catch(error => console.error('Error converting base64 to blob:', error));
  }

  update(): void {
    if (this.button) {
      this.button.title = this.core!.i18n.translate('File');
    }
  }

  private onUploadFileClick(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true; // Allows selection of multiple files
    input.onchange = (event) => this.handleFileUpload(event);
    input.click();
  }

  private handleFileUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      Array.from(files).forEach(file => this.uploadFile(file));
    }
  }

  private createFileBlock(fileName: string, downloadUrl: string): void {
    const fileBlock = document.createElement('div');
    fileBlock.classList.add('file-block');
    this.applyStyles(fileBlock, {
      border: '1px solid gray',
      borderRadius: '7px',
      padding: '5px',
      backgroundColor: '#ddddff',
      display: 'inline-flex',
    })

    const downloadLink = document.createElement('a');
    this.applyStyles(downloadLink, {
      color: 'black',
      cursor: 'pointer',
    })
    downloadLink.href = downloadUrl;
    downloadLink.textContent = fileName;
    downloadLink.download = fileName;


    fileBlock.appendChild(downloadLink);

    this.core?.insertHTMLIntoEditor(fileBlock.outerHTML);
  }

  private async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(this.uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const data = await response.json();
      this.createFileBlock(file.name, data.downloadUrl); // Assuming the response includes a download URL
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }

  private async deleteFile(fileBlock: HTMLElement, fileName: string): Promise<void> {
    try {
      const response = await fetch(`${this.deleteEndpoint}/${fileName}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('File deletion failed');
      }

      fileBlock.remove();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  private applyStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.assign(element.style, styles);
  }

  destroy(): void {
    this.core = null;
    this.button?.removeEventListener('click', this.onUploadFileClick);
    this.button = null;
  }
}

export default FileButton;
