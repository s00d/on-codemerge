import { defaultConfig } from '../config/UploadConfig';
import type { UploadConfig } from '../config/UploadConfig';
import { downloadBlob, downloadUrl } from '@on-codemerge/sdk';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
}

export class FileUploader {
  private readonly files = new Map<string, UploadedFile>();
  private readonly config: UploadConfig;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public async uploadFile(file: File): Promise<UploadedFile> {
    // Validate file
    if (file.size > (this.config.maxFileSize ?? defaultConfig.maxFileSize!)) {
      throw new Error(`File size exceeds ${this.formatFileSize(this.config.maxFileSize!)}`);
    }

    if (!this.isFileTypeAllowed(file)) {
      throw new Error('File type not allowed');
    }

    // Use real endpoints if configured and emulation is disabled
    if (this.config.endpoints?.upload && !this.config.useEmulation) {
      return await this.uploadToServer(file);
    }

    // Fallback to emulation
    return await this.emulateUpload(file);
  }

  public async downloadFile(id: string): Promise<void> {
    // Use real endpoint if configured and emulation is disabled
    if (this.config.endpoints?.download && !this.config.useEmulation) {
      await this.downloadFromServer(id);
      return;
    }

    // Fallback to emulation
    this.emulateDownload(id);
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

    const data: unknown = await response.json();
    let id = '';
    if (typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string') {
      id = data.id;
    }
    return {
      id,
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
      response.headers.get('content-disposition')?.split('filename=')[1] ?? 'download';

    downloadUrl(url, filename.replaceAll('"', ''));
    URL.revokeObjectURL(url);
  }

  private async emulateUpload(file: File): Promise<UploadedFile> {
    // Simulate network delay
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000);
    });

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

  private emulateDownload(id: string): void {
    const file = this.files.get(id);
    if (!file) {
      throw new Error('File not found');
    }

    const blob = new Blob([file.data], { type: file.type });
    downloadBlob(blob, file.name, file.type);
  }

  private isFileTypeAllowed(file: File): boolean {
    const allowedTypes = this.config.allowedTypes ?? defaultConfig.allowedTypes!;
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
