import type { IncomingMessage } from 'node:http';

const MAX_BODY = 12 * 1024 * 1024; // slightly above 10MB upload cap

export type MultipartFile = {
  filename: string;
  mime: string;
  data: Buffer;
};

export async function readRawBody(req: IncomingMessage, max = MAX_BODY): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.byteLength;
    if (total > max) {
      throw new Error(`Body exceeds ${max} bytes`);
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

/**
 * Minimal multipart/form-data parser for a single `file` field (docs DEV only).
 */
export function parseMultipartFile(body: Buffer, contentType: string): MultipartFile | null {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
  if (!boundary) {
    return null;
  }
  const delim = Buffer.from(`--${boundary}`);
  let start = indexOf(body, delim, 0);
  if (start < 0) {
    return null;
  }
  start += delim.byteLength;
  if (body[start] === 0x0d && body[start + 1] === 0x0a) {
    start += 2;
  }

  while (start < body.byteLength) {
    const next = indexOf(body, delim, start);
    const end = next < 0 ? body.byteLength : next;
    // Part ends with \r\n before boundary
    let partEnd = end;
    if (partEnd >= 2 && body[partEnd - 2] === 0x0d && body[partEnd - 1] === 0x0a) {
      partEnd -= 2;
    }
    const part = body.subarray(start, partEnd);
    const headerSep = indexOf(part, Buffer.from('\r\n\r\n'), 0);
    if (headerSep >= 0) {
      const headerText = part.subarray(0, headerSep).toString('utf8');
      const data = part.subarray(headerSep + 4);
      if (/name="file"/i.test(headerText)) {
        const filename =
          /filename="([^"]*)"/i.exec(headerText)?.[1] ||
          /filename\*=UTF-8''([^;\r\n]+)/i.exec(headerText)?.[1] ||
          'upload.bin';
        const mime =
          /Content-Type:\s*([^\r\n]+)/i.exec(headerText)?.[1]?.trim() || 'application/octet-stream';
        return {
          filename: decodeURIComponent(filename),
          mime,
          data: Buffer.from(data),
        };
      }
    }
    if (next < 0) {
      break;
    }
    start = next + delim.byteLength;
    if (body[start] === 0x2d && body[start + 1] === 0x2d) {
      break; // closing --
    }
    if (body[start] === 0x0d && body[start + 1] === 0x0a) {
      start += 2;
    }
  }
  return null;
}

function indexOf(haystack: Buffer, needle: Buffer, from: number): number {
  return haystack.indexOf(needle, from);
}
