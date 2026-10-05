import { MAX_TABLE_BYTES } from './constants';
import { parseCsv, parseJsonToMatrix } from './matrix';

export type LazyFormat = 'json' | 'csv';

export type LazyTableConfig = {
  url: string;
  format?: LazyFormat;
  /** Treat first row as header (also used when JSON is array-of-objects). */
  headers?: boolean;
  delimiter?: string;
};

function ipv4OctetsFromHost(host: string): number[] | null {
  // Dotted decimal
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split('.').map((p) => Number(p));
    if (parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      return parts;
    }
    return null;
  }
  // Single integer / hex / octal forms → 32-bit IPv4
  let n: number | null = null;
  if (/^0x[0-9a-f]+$/i.test(host)) {
    n = Number.parseInt(host, 16);
  } else if (/^0[0-7]+$/.test(host)) {
    n = Number.parseInt(host, 8);
  } else if (/^\d+$/.test(host)) {
    n = Math.trunc(Number(host));
  }
  if (n === null || !Number.isFinite(n) || n < 0 || n > 0xff_ff_ff_ff) {
    return null;
  }
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function isIpLiteral(hostname: string): boolean {
  if (hostname.startsWith('[')) {
    return true;
  }
  const host = hostname
    .toLowerCase()
    .replaceAll(/^\[|\]$/g, '')
    .replace(/\.+$/, '');
  if (host.includes(':')) {
    return true;
  }
  return ipv4OctetsFromHost(host) !== null;
}

function isPrivateHost(hostRaw: string): boolean {
  const host = hostRaw
    .toLowerCase()
    .replaceAll(/^\[|\]$/g, '')
    .replace(/\.+$/, '');
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host === 'localtest.me' ||
    host.endsWith('.localtest.me') ||
    host === 'lvh.me' ||
    host.endsWith('.lvh.me') ||
    host === 'nip.io' ||
    host.endsWith('.nip.io') ||
    host === 'sslip.io' ||
    host.endsWith('.sslip.io') ||
    host === 'xip.io' ||
    host.endsWith('.xip.io') ||
    host === 'localho.st' ||
    host.endsWith('.localho.st') ||
    host === 'lacolhost.com' ||
    host.endsWith('.lacolhost.com') ||
    host === 'bs-local.com' ||
    host.endsWith('.bs-local.com') ||
    host === 'traefik.me' ||
    host.endsWith('.traefik.me') ||
    host === 'localhost.direct' ||
    host.endsWith('.localhost.direct') ||
    host === 'local.sisteminha.com' ||
    host.endsWith('.local.sisteminha.com') ||
    host === 'docker.internal' ||
    host.endsWith('.docker.internal') ||
    host === 'local.gd' ||
    host.endsWith('.local.gd') ||
    host === 'localhost.tv' ||
    host.endsWith('.localhost.tv') ||
    host === 'lcl.host' ||
    host.endsWith('.lcl.host') ||
    host.includes('metadata.google.internal')
  ) {
    return true;
  }
  return false;
}

/** Reject non-http(s), IP literals, and private/loopback DNS helpers (SSRF guard). */
export function assertSafeLazyUrl(url: string): URL {
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Lazy table URL must be http(s)');
  }
  if (u.username || u.password) {
    u.username = '';
    u.password = '';
  }
  if (isIpLiteral(u.hostname) || isPrivateHost(u.hostname)) {
    throw new Error('Lazy table URL must not target a private host');
  }
  return u;
}

async function readBodyCapped(res: Response): Promise<ArrayBuffer> {
  const clRaw = res.headers?.get?.('content-length') ?? null;
  if (clRaw !== null && /^\d+$/.test(clRaw)) {
    const cl = Number(clRaw);
    if (cl > MAX_TABLE_BYTES) {
      throw new Error(`Lazy table response exceeds ${MAX_TABLE_BYTES} bytes`);
    }
  }
  const body = res.body;
  if (body && typeof body.getReader === 'function') {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value === undefined || value.byteLength === 0) {
        continue;
      }
      total += value.byteLength;
      if (total > MAX_TABLE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        throw new Error(`Lazy table response exceeds ${MAX_TABLE_BYTES} bytes`);
      }
      chunks.push(value);
    }
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      out.set(c, off);
      off += c.byteLength;
    }
    return out.buffer;
  }
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_TABLE_BYTES) {
    throw new Error(`Lazy table response exceeds ${MAX_TABLE_BYTES} bytes`);
  }
  return buf;
}

export async function fetchLazyMatrix(
  config: LazyTableConfig
): Promise<{ matrix: string[][]; hasHeader: boolean }> {
  const url = config.url.trim();
  if (!url) {
    throw new Error('Lazy table URL is required');
  }
  const safe = assertSafeLazyUrl(url);
  const format: LazyFormat = config.format === 'csv' ? 'csv' : 'json';
  const res = await fetch(safe.href, { credentials: 'omit', redirect: 'error' });
  if (!res.ok) {
    throw new Error(`Lazy table fetch failed (${res.status})`);
  }
  const buf = await readBodyCapped(res);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (format === 'csv') {
    const matrix = parseCsv(text, config.delimiter ?? ',');
    return { matrix, hasHeader: config.headers !== false };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Lazy table JSON parse failed');
  }
  return parseJsonToMatrix(data, config.headers !== false);
}
