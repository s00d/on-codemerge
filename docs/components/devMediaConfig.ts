/**
 * Docs live demos: wire real upload/list/preview URLs only under `vitepress dev`.
 * Static `docs:build` / GH Pages keep emulation + local MD projector (no /api/*).
 */

export const isDocsDev = import.meta.env.DEV === true;

export const docsImageUpload = isDocsDev
  ? {
      endpoints: {
        upload: '/api/media/upload',
        list: '/api/media/images',
        delete: '/api/media',
      },
      useEmulation: false as const,
    }
  : {};

export const docsFileUpload = isDocsDev
  ? {
      endpoints: {
        upload: '/api/files/upload',
        download: '/api/files/download',
        list: '/api/files',
        delete: '/api/files',
      },
      useEmulation: false as const,
    }
  : {};

export const docsMdPreview = isDocsDev ? { url: '/api/md-preview', debounceMs: 400 } : undefined;
