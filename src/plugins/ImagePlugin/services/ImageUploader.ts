import { pickFile } from '@on-codemerge/sdk';

export class ImageUploader {
  public async selectFile(): Promise<File | null> {
    const files = await pickFile({ accept: 'image/*' });
    return files?.[0] ?? null;
  }

  public readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      });
      reader.addEventListener('error', () => {
        reject(reader.error);
      });
      reader.readAsDataURL(file);
    });
  }
}
