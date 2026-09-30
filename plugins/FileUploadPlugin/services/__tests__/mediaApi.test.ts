import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  assertFileAllowed,
  parseMediaListResponse,
  parseMediaUploadResult,
  listMedia,
  uploadMedia,
  deleteMedia,
  formatFileSize,
} from '../mediaApi';

describe('mediaApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses list response and drops invalid items', () => {
    const items = parseMediaListResponse({
      items: [
        { id: '1', name: 'a.png', url: 'https://x/a.png', thumbUrl: 'https://x/t.png' },
        { id: '', name: 'bad', url: 'https://x/b' },
        { id: '2', name: 'b.pdf', url: 'https://x/b.pdf', size: 12, mime: 'application/pdf' },
      ],
    });
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: '1', thumbUrl: 'https://x/t.png' });
    expect(items[1]?.size).toBe(12);
  });

  it('requires id and url on upload result', () => {
    expect(() => parseMediaUploadResult({ name: 'x' }, 'x')).toThrow(/missing id or url/);
    expect(parseMediaUploadResult({ id: '1', url: '/u', name: '' }, 'fallback.bin')).toStrictEqual({
      id: '1',
      name: 'fallback.bin',
      url: '/u',
      size: undefined,
      mime: undefined,
    });
  });

  it('assertFileAllowed enforces size and mime', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    expect(() => assertFileAllowed(file, { maxFileSize: 0, allowedTypes: ['image/png'] })).toThrow(
      /exceeds/
    );
    expect(() =>
      assertFileAllowed(file, { maxFileSize: 100, allowedTypes: ['image/jpeg'] })
    ).toThrow(/not allowed/);
    expect(() =>
      assertFileAllowed(file, { maxFileSize: 100, allowedTypes: ['*/*'] })
    ).not.toThrow();
  });

  it('listMedia GETs with headers', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ items: [{ id: '1', name: 'a', url: '/a' }] }), {
          status: 200,
        })
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const items = await listMedia('/api/list', { Authorization: 'Bearer t' });
    expect(items).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/list',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer t' }),
      })
    );
  });

  it('uploadMedia POSTs multipart file', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      expect(init?.body).toBeInstanceOf(FormData);
      const fd = init?.body as FormData;
      expect(fd.get('file')).toBeInstanceOf(Blob);
      return Promise.resolve(
        new Response(JSON.stringify({ id: '9', name: 'x.png', url: '/x.png' }), { status: 200 })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await uploadMedia(
      '/api/upload',
      new Blob(['hi'], { type: 'image/png' }),
      { 'X-Token': '1' },
      'x.png'
    );
    expect(result.url).toBe('/x.png');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/upload',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('deleteMedia DELETEs {base}/{id}', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    await deleteMedia('/api/media/', 'a b', { Authorization: 'Bearer t' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/media/a%20b',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ Authorization: 'Bearer t' }),
      })
    );
  });

  it('formatFileSize', () => {
    expect(formatFileSize(500)).toMatch(/B/);
    expect(formatFileSize(2048)).toMatch(/KB/);
  });
});
