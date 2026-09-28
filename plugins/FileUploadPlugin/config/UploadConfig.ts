export interface UploadEndpoints {
  upload?: string;
  download?: string;
}

export interface UploadConfig {
  endpoints?: UploadEndpoints;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  useEmulation?: boolean;
}

export const defaultConfig: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['*/*'],
  useEmulation: true,
};
