import { downloadBlob, downloadUrl } from '@codemerge/sdk';
import { defaultConfig } from '../config/UploadConfig';
import type { UploadConfig } from '../config/UploadConfig';
import { assertFileAllowed, formatFileSize, listMedia, uploadMedia, deleteMedia } from './mediaApi';
import type { MediaListItem, MediaUploadResult } from './mediaApi';

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  data?: ArrayBuffer;
};

export class FileUploader {
  private readonly files = new Map<string, UploadedFile>();
  private readonly config: UploadConfig;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = { ...defaultConfig, ...config, endpoints: { ...config.endpoints } };
  }

  public get listUrl(): string | undefined {
    const url = this.config.endpoints?.list?.trim();
    return url || undefined;
  }

  public get deleteUrl(): string | undefined {
    const url = this.config.endpoints?.delete?.trim();
    return url || undefined;
  }

  public get headers(): Record<string, string> | undefined {
    return this.config.headers;
  }

  public listFiles(): Promise<MediaListItem[]> {
    const url = this.listUrl;
    if (!url) {
      return Promise.resolve([]);
    }
    return listMedia(url, this.config.headers);
  }

  public async deleteListedFile(id: string): Promise<void> {
    const url = this.deleteUrl;
    if (!url) {
      throw new Error('Delete endpoint is not configured');
    }
    await deleteMedia(url, id, this.config.headers);
    this.files.delete(id);
  }

  public async uploadFile(file: File): Promise<UploadedFile> {
    assertFileAllowed(file, {
      maxFileSize: this.config.maxFileSize ?? defaultConfig.maxFileSize!,
      allowedTypes: this.config.allowedTypes ?? defaultConfig.allowedTypes!,
    });

    const uploadUrl = this.config.endpoints?.upload?.trim();
    if (uploadUrl && this.config.useEmulation !== true) {
      const result = await uploadMedia(uploadUrl, file, this.config.headers, file.name);
      return this.fromUploadResult(result, file.type);
    }

    return this.emulateUpload(file);
  }

  public uploadBlob(
    blob: Blob,
    filename: string,
    mime = blob.type || 'application/octet-stream'
  ): Promise<UploadedFile> {
    const file = new File([blob], filename, { type: mime });
    return this.uploadFile(file);
  }

  public async downloadFile(id: string): Promise<void> {
    if (this.config.endpoints?.download && this.config.useEmulation !== true) {
      await this.downloadFromServer(id);
      return;
    }
    this.emulateDownload(id);
  }

  private fromUploadResult(result: MediaUploadResult, fallbackType: string): UploadedFile {
    const uploaded: UploadedFile = {
      id: result.id,
      name: result.name,
      size: result.size ?? 0,
      type: result.mime ?? fallbackType,
      url: result.url,
    };
    this.files.set(uploaded.id, uploaded);
    return uploaded;
  }

  private async downloadFromServer(id: string): Promise<void> {
    const base = this.config.endpoints!.download!.replace(/\/$/, '');
    const response = await fetch(`${base}/${id}`, {
      method: 'GET',
      headers: { ...this.config.headers },
    });
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
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 200);
    });

    const data = await file.arrayBuffer();
    const uploadedFile: UploadedFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      data,
      url: URL.createObjectURL(new Blob([data], { type: file.type })),
    };

    this.files.set(uploadedFile.id, uploadedFile);
    return uploadedFile;
  }

  private emulateDownload(id: string): void {
    const file = this.files.get(id);
    if (!file?.data) {
      throw new Error('File not found');
    }

    const blob = new Blob([file.data], { type: file.type });
    downloadBlob(blob, file.name, file.type);
  }

  public formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }
}
