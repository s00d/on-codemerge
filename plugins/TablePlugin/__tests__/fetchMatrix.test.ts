import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_TABLE_BYTES } from '../io/constants';
import { assertSafeLazyUrl, fetchLazyMatrix } from '../io/fetchMatrix';

describe('assertSafeLazyUrl', () => {
  it('allows public https', () => {
    expect(assertSafeLazyUrl('https://example.com/data.json').hostname).toBe('example.com');
  });

  it('blocks decimal loopback', () => {
    expect(() => assertSafeLazyUrl('http://2130706433/')).toThrow(/private/);
  });

  it('blocks hex loopback', () => {
    expect(() => assertSafeLazyUrl('http://0x7f000001/')).toThrow(/private/);
  });

  it('blocks localhost', () => {
    expect(() => assertSafeLazyUrl('http://localhost/x')).toThrow(/private/);
  });

  it('blocks IPv4-compatible IPv6 loopback', () => {
    expect(() => assertSafeLazyUrl('http://[::127.0.0.1]/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://[::7f00:1]/x')).toThrow(/private/);
  });

  it('blocks nip.io / sslip.io helpers', () => {
    expect(() => assertSafeLazyUrl('http://10.0.0.1.nip.io/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://127-0-0-1.sslip.io/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://nip.io/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://sslip.io/x')).toThrow(/private/);
  });

  it('strips trailing FQDN dots before private-host checks', () => {
    expect(() => assertSafeLazyUrl('http://localhost./x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://127.0.0.1./x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://10.0.0.1.nip.io./x')).toThrow(/private/);
  });

  it('blocks localho.st / lacolhost.com / bs-local.com / traefik.me helpers', () => {
    expect(() => assertSafeLazyUrl('http://localho.st/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://foo.localho.st/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://lacolhost.com/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://bs-local.com/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://traefik.me/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://foo.traefik.me/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://localho.st./x')).toThrow(/private/);
  });

  it('blocks localhost.direct / local.sisteminha.com helpers', () => {
    expect(() => assertSafeLazyUrl('http://localhost.direct/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://foo.localhost.direct/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://localhost.direct./x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://local.sisteminha.com/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://foo.local.sisteminha.com/x')).toThrow(/private/);
  });

  it('blocks docker.internal helpers', () => {
    expect(() => assertSafeLazyUrl('http://host.docker.internal/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://gateway.docker.internal/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://kubernetes.docker.internal/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://docker.internal/x')).toThrow(/private/);
  });

  it('blocks local.gd / localhost.tv / lcl.host helpers', () => {
    expect(() => assertSafeLazyUrl('http://local.gd/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://foo.local.gd/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://localhost.tv/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://foo.localhost.tv/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://lcl.host/x')).toThrow(/private/);
    expect(() => assertSafeLazyUrl('http://foo.lcl.host/x')).toThrow(/private/);
  });

  it('strips URL userinfo before return', () => {
    const u = assertSafeLazyUrl('https://user:pass@example.com/data.json');
    expect(u.username).toBe('');
    expect(u.password).toBe('');
    expect(u.href).toBe('https://example.com/data.json');
  });
});

describe('fetchLazyMatrix size cap', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects oversized content-length before reading body', async () => {
    expect.hasAssertions();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: {
            get: (k: string) => (k === 'content-length' ? String(MAX_TABLE_BYTES + 1) : null),
          },
          body: null,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        })
      )
    );
    await expect(
      fetchLazyMatrix({ url: 'https://example.com/big.json', format: 'json' })
    ).rejects.toThrow(/exceeds/);
  });

  it('rejects streaming bodies that exceed the cap mid-read', async () => {
    expect.hasAssertions();
    const chunk = new Uint8Array(Math.ceil(MAX_TABLE_BYTES / 2) + 1);
    let reads = 0;
    const reader = {
      read: () => {
        reads += 1;
        if (reads <= 2) {
          return Promise.resolve({ done: false, value: chunk });
        }
        return Promise.resolve({ done: true, value: undefined });
      },
      cancel: () => Promise.resolve(),
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: { get: () => null },
          body: { getReader: () => reader },
        })
      )
    );
    await expect(
      fetchLazyMatrix({ url: 'https://example.com/stream.json', format: 'json' })
    ).rejects.toThrow(/exceeds/);
  });
});
