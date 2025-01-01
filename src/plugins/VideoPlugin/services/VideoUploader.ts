import { createInputField } from '../../../utils/helpers.ts';

export class VideoUploader {
  public async selectFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = createInputField('file', 'Select File', '', () => {
        const file = input.files?.[0] || null;
        resolve(file);
      });
      input.accept = 'video/*';
      input.click();
    });
  }

  public readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
