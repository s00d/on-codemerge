/** Shared list/upload helpers for FileUpload + Image plugins. */

export type MediaListItem = {
  id: string;
  name: string;
  url: string;
  size?: number;
  mime?: string;
  thumbUrl?: string;
};

export type MediaUploadResult = {
  id: string;
  name: string;
  url: string;
  size?: number;
  mime?: string;
};

export type MediaListResponse = {
  items: MediaListItem[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = v;
  }
  return out;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function parseMediaListItem(raw: unknown): MediaListItem | null {
  const o = asRecord(raw);
  if (!o) {
    return null;
  }
  const id = asString(o.id).trim();
  const name = asString(o.name).trim();
  const url = asString(o.url).trim();
  if (!id || !name || !url) {
    return null;
  }
  const thumb = asString(o.thumbUrl).trim();
  return {
    id,
    name,
    url,
    size: asOptionalNumber(o.size),
    mime: asString(o.mime).trim() || undefined,
    ...(thumb ? { thumbUrl: thumb } : {}),
  };
}

export function parseMediaListResponse(raw: unknown): MediaListItem[] {
  const o = asRecord(raw);
  const items = o && Array.isArray(o.items) ? o.items : null;
  if (!items) {
    throw new Error('Invalid media list response');
  }
  const out: MediaListItem[] = [];
  for (const item of items) {
    const parsed = parseMediaListItem(item);
    if (parsed) {
      out.push(parsed);
    }
  }
  return out;
}

export function parseMediaUploadResult(raw: unknown, fallbackName: string): MediaUploadResult {
  const o = asRecord(raw);
  if (!o) {
    throw new Error('Invalid upload response');
  }
  const id = asString(o.id).trim();
  const url = asString(o.url).trim();
  if (!id || !url) {
    throw new Error('Upload response missing id or url');
  }
  return {
    id,
    name: asString(o.name).trim() || fallbackName,
    url,
    size: asOptionalNumber(o.size),
    mime: asString(o.mime).trim() || undefined,
  };
}

export function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes('*/*') || allowedTypes.includes(file.type);
}

export function assertFileAllowed(
  file: File,
  opts: { maxFileSize: number; allowedTypes: string[] }
): void {
  if (file.size > opts.maxFileSize) {
    throw new Error(`File size exceeds ${opts.maxFileSize} bytes`);
  }
  if (!isFileTypeAllowed(file, opts.allowedTypes)) {
    throw new Error('File type not allowed');
  }
}

export async function listMedia(
  listUrl: string,
  headers?: Record<string, string>
): Promise<MediaListItem[]> {
  const response = await fetch(listUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });
  if (!response.ok) {
    throw new Error(`List failed (HTTP ${response.status})`);
  }
  return parseMediaListResponse(await response.json());
}

export async function uploadMedia(
  uploadUrl: string,
  file: Blob,
  headers?: Record<string, string>,
  filename = 'upload.bin'
): Promise<MediaUploadResult> {
  const formData = new FormData();
  const named =
    file instanceof File
      ? file
      : new File([file], filename, { type: file.type || 'application/octet-stream' });
  formData.append('file', named);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...headers,
      // Let the browser set multipart boundary — do not set Content-Type.
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (HTTP ${response.status})`);
  }
  return parseMediaUploadResult(await response.json(), named.name);
}

/** `DELETE {deleteBase}/{id}` — empty 2xx body is fine. */
export async function deleteMedia(
  deleteBase: string,
  id: string,
  headers?: Record<string, string>
): Promise<void> {
  const base = deleteBase.replace(/\/$/, '');
  const response = await fetch(`${base}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Delete failed (HTTP ${response.status})`);
  }
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
