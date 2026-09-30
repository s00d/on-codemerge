export interface UploadEndpoints {
  upload?: string;
  download?: string;
  /** When set, media modals show a Gallery tab (`GET` → `{ items: [...] }`). */
  list?: string;
  /** When set, gallery shows delete (`DELETE {delete}/{id}`). */
  delete?: string;
}

export interface UploadConfig {
  endpoints?: UploadEndpoints;
  /** Extra headers for list / upload / download fetch calls. */
  headers?: Record<string, string>;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  /**
   * When true, ignore `endpoints.upload` and keep an in-memory Map (demos / offline).
   * Default true so demos work without a server; set false when using real upload URLs.
   */
  useEmulation?: boolean;
}

export const defaultConfig: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['*/*'],
  useEmulation: true,
};
