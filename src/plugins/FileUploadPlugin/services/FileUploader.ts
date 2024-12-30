import { type UploadConfig, defaultConfig } from '../config/UploadConfig';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
}

export class FileUploader {
  private files: Map<string, UploadedFile> = new Map();
  private config: UploadConfig;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public async uploadFile(file: File): Promise<UploadedFile> {
    // Validate file
    if (file.size > (this.config.maxFileSize || defaultConfig.maxFileSize!)) {
      throw new Error(`File size exceeds ${this.formatFileSize(this.config.maxFileSize!)}`);
    }

    if (!this.isFileTypeAllowed(file)) {
      throw new Error('File type not allowed');
    }

    // Use real endpoints if configured and emulation is disabled
    if (this.config.endpoints?.upload && !this.config.useEmulation) {
      return this.uploadToServer(file);
    }

    // Fallback to emulation
    return this.emulateUpload(file);
  }

  public async downloadFile(id: string): Promise<void> {
    // Use real endpoint if configured and emulation is disabled
    if (this.config.endpoints?.download && !this.config.useEmulation) {
      await this.downloadFromServer(id);
      return;
    }

    // Fallback to emulation
    await this.emulateDownload(id);
  }

  private async uploadToServer(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(this.config.endpoints!.upload!, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return {
      id: data.id,
      name: file.name,
      size: file.size,
      type: file.type,
      data: await file.arrayBuffer(),
    };
  }

  private async downloadFromServer(id: string): Promise<void> {
    const response = await fetch(`${this.config.endpoints!.download!}/${id}`);
    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const filename =
      response.headers.get('content-disposition')?.split('filename=')[1] || 'download';

    this.triggerDownload(url, filename);
  }

  private async emulateUpload(file: File): Promise<UploadedFile> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const uploadedFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      data: await file.arrayBuffer(),
    };

    this.files.set(uploadedFile.id, uploadedFile);
    return uploadedFile;
  }

  private async emulateDownload(id: string): Promise<void> {
    const file = this.files.get(id);
    if (!file) {
      throw new Error('File not found');
    }

    const blob = new Blob([file.data], { type: file.type });
    const url = URL.createObjectURL(blob);
    this.triggerDownload(url, file.name);
  }

  private triggerDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private isFileTypeAllowed(file: File): boolean {
    const allowedTypes = this.config.allowedTypes || defaultConfig.allowedTypes!;
    return allowedTypes.includes('*/*') || allowedTypes.includes(file.type);
  }

  public formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
