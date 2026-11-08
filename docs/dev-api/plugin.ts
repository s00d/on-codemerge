import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import { parseMultipartFile, readRawBody } from './multipart.ts';
import { getFile, listFiles, putFile, removeFile, toListItem } from './store.ts';

const MAX_UPLOAD = 10 * 1024 * 1024;

/**
 * VitePress DEV-only API for image/file media + Markdown remote preview.
 * Registered via `configureServer` only — never present in `docs:build` output.
 */
export function docsDevApiPlugin(): Plugin {
  return {
    name: 'ocm-docs-dev-api',
    configureServer(server) {
      server.middlewares.use(createDevApiMiddleware(server));
    },
  };
}

function createDevApiMiddleware(server: ViteDevServer): Connect.NextHandleFunction {
  return (req, res, next) => {
    void handle(req, res, next, server);
  };
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
  server: ViteDevServer
): Promise<void> {
  const url = req.url ? new URL(req.url, 'http://localhost') : null;
  if (!url || !url.pathname.startsWith('/api/')) {
    next();
    return;
  }

  try {
    const { pathname } = url;
    const method = (req.method ?? 'GET').toUpperCase();

    if (method === 'POST' && pathname === '/api/media/upload') {
      await handleUpload(req, res, '/api/media/blob');
      return;
    }
    if (method === 'GET' && pathname === '/api/media/images') {
      sendJson(res, 200, {
        items: listFiles((f) => f.mime.startsWith('image/')).map((f) =>
          toListItem(f, `/api/media/blob/${f.id}`)
        ),
      });
      return;
    }
    if (method === 'GET' && pathname.startsWith('/api/media/blob/')) {
      serveBlob(res, pathname.slice('/api/media/blob/'.length));
      return;
    }
    if (method === 'DELETE' && pathname.startsWith('/api/media/')) {
      const id = pathname.slice('/api/media/'.length).split('/')[0] ?? '';
      if (!id || id === 'upload' || id === 'images' || id === 'blob') {
        sendJson(res, 404, { error: 'Not found' });
        return;
      }
      if (!removeFile(decodeURIComponent(id))) {
        sendJson(res, 404, { error: 'File not found' });
        return;
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === 'POST' && pathname === '/api/files/upload') {
      await handleUpload(req, res, '/api/files/download');
      return;
    }
    if (method === 'GET' && pathname === '/api/files') {
      sendJson(res, 200, {
        items: listFiles().map((f) => toListItem(f, `/api/files/download/${f.id}`)),
      });
      return;
    }
    if (method === 'GET' && pathname.startsWith('/api/files/download/')) {
      serveBlob(res, pathname.slice('/api/files/download/'.length), true);
      return;
    }
    if (method === 'DELETE' && pathname.startsWith('/api/files/')) {
      const rest = pathname.slice('/api/files/'.length);
      if (!rest || rest === 'upload' || rest.startsWith('download/')) {
        sendJson(res, 404, { error: 'Not found' });
        return;
      }
      const id = rest.split('/')[0] ?? '';
      if (!id || !removeFile(decodeURIComponent(id))) {
        sendJson(res, 404, { error: 'File not found' });
        return;
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === 'POST' && pathname === '/api/md-preview') {
      await handleMdPreview(req, res, server);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    if (!res.headersSent) {
      sendJson(res, 500, { error: message });
    }
  }
}

async function handleUpload(
  req: IncomingMessage,
  res: ServerResponse,
  urlPrefix: string
): Promise<void> {
  const rawCt = req.headers['content-type'];
  const contentType = typeof rawCt === 'string' ? rawCt : '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    sendJson(res, 400, { error: 'Expected multipart/form-data' });
    return;
  }
  const body = await readRawBody(req);
  const file = parseMultipartFile(body, contentType);
  if (!file) {
    sendJson(res, 400, { error: 'Missing file field' });
    return;
  }
  if (file.data.byteLength > MAX_UPLOAD) {
    sendJson(res, 400, { error: `File exceeds ${MAX_UPLOAD} bytes` });
    return;
  }
  const stored = putFile({
    name: file.filename,
    mime: file.mime,
    data: file.data,
  });
  sendJson(res, 200, {
    id: stored.id,
    name: stored.name,
    url: `${urlPrefix}/${stored.id}`,
    size: stored.size,
    mime: stored.mime,
  });
}

function serveBlob(res: ServerResponse, id: string, asAttachment = false): void {
  const clean = decodeURIComponent(id.split('?')[0] ?? id).replace(/\/$/, '');
  const file = getFile(clean);
  if (!file) {
    sendJson(res, 404, { error: 'File not found' });
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', file.mime);
  res.setHeader('Content-Length', String(file.size));
  if (asAttachment) {
    res.setHeader('Content-Disposition', `attachment; filename="${file.name.replaceAll('"', '')}"`);
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  res.end(file.data);
}

async function handleMdPreview(
  req: IncomingMessage,
  res: ServerResponse,
  server: ViteDevServer
): Promise<void> {
  const raw = await readRawBody(req);
  let markdown = '';
  try {
    const parsed: unknown = JSON.parse(raw.toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null || !('markdown' in parsed)) {
      sendJson(res, 400, { error: 'Expected JSON { markdown: string }' });
      return;
    }
    const md = Reflect.get(parsed, 'markdown');
    if (typeof md !== 'string') {
      sendJson(res, 400, { error: 'Expected JSON { markdown: string }' });
      return;
    }
    markdown = md;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const mdModulePath = fileURLToPath(new URL('./mdPreview.ts', import.meta.url));
  const mod = (await server.ssrLoadModule(mdModulePath)) as {
    renderDevMdPreview: (md: string) => string;
  };
  const html = mod.renderDevMdPreview(markdown);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
