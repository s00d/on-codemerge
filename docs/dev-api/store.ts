/**
 * Filesystem media store for docs DEV API.
 * All uploads live in `./uploads/` (survives `docs:dev` restarts).
 * Gallery lists whatever is on disk — no in-code seed blobs.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type StoredFile = {
  id: string;
  name: string;
  mime: string;
  size: number;
  data: Buffer;
};

const UPLOAD_DIR = fileURLToPath(new URL('./uploads', import.meta.url));
const SEP = '__';
let seq = 0;

function ensureDir(): void {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function sanitizeName(name: string): string {
  const base = basename(name || 'upload.bin').replaceAll(/[^\w.\-()+ ]+/g, '_');
  return base.trim() || 'upload.bin';
}

function mimeFromName(name: string, fallback = 'application/octet-stream'): string {
  const ext = extname(name).toLowerCase();
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
  };
  return map[ext] ?? fallback;
}

function diskName(id: string, name: string): string {
  return `${id}${SEP}${sanitizeName(name)}`;
}

function parseDiskName(file: string): { id: string; name: string } | null {
  const i = file.indexOf(SEP);
  if (i <= 0) {
    return null;
  }
  const id = file.slice(0, i);
  const name = file.slice(i + SEP.length);
  if (!id || !name || name.startsWith('.')) {
    return null;
  }
  return { id, name };
}

function pathForId(id: string): string | null {
  ensureDir();
  const clean = id.replaceAll(/[/\\]/g, '');
  if (!clean) {
    return null;
  }
  const prefix = `${clean}${SEP}`;
  const match = readdirSync(UPLOAD_DIR).find((f) => f.startsWith(prefix));
  return match ? join(UPLOAD_DIR, match) : null;
}

function readStored(filePath: string, id: string, name: string): StoredFile {
  const data = readFileSync(filePath);
  return {
    id,
    name,
    mime: mimeFromName(name),
    size: data.byteLength,
    data,
  };
}

export function putFile(input: { name: string; mime: string; data: Buffer }): StoredFile {
  ensureDir();
  seq += 1;
  const id = `dev-${Date.now().toString(36)}-${seq}`;
  const name = sanitizeName(input.name);
  const filePath = join(UPLOAD_DIR, diskName(id, name));
  writeFileSync(filePath, input.data);
  return {
    id,
    name,
    mime: input.mime || mimeFromName(name),
    size: input.data.byteLength,
    data: input.data,
  };
}

export function removeFile(id: string): boolean {
  const filePath = pathForId(id);
  if (!filePath) {
    return false;
  }
  unlinkSync(filePath);
  return true;
}

export function getFile(id: string): StoredFile | undefined {
  const filePath = pathForId(id);
  if (!filePath) {
    return undefined;
  }
  const parsed = parseDiskName(basename(filePath));
  if (!parsed) {
    return undefined;
  }
  return readStored(filePath, parsed.id, parsed.name);
}

export function listFiles(filter?: (f: StoredFile) => boolean): StoredFile[] {
  ensureDir();
  const out: StoredFile[] = [];
  for (const file of readdirSync(UPLOAD_DIR)) {
    if (file.startsWith('.')) {
      continue;
    }
    const parsed = parseDiskName(file);
    if (!parsed) {
      continue;
    }
    const stored = readStored(join(UPLOAD_DIR, file), parsed.id, parsed.name);
    if (!filter || filter(stored)) {
      out.push(stored);
    }
  }
  // Stable order: newest id first (timestamp in id), then name.
  out.sort((a, b) => b.id.localeCompare(a.id) || a.name.localeCompare(b.name));
  return out;
}

export function toListItem(
  f: StoredFile,
  url: string
): { id: string; name: string; url: string; size: number; mime: string; thumbUrl?: string } {
  const item = {
    id: f.id,
    name: f.name,
    url,
    size: f.size,
    mime: f.mime,
  };
  if (f.mime.startsWith('image/')) {
    return { ...item, thumbUrl: url };
  }
  return item;
}

/** Absolute path to the on-disk media directory. */
export function uploadsDir(): string {
  return UPLOAD_DIR;
}
