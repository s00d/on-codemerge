import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

describe('@codemerge/mermaid size', () => {
  it('keeps dist entry under 50KB gzip', () => {
    const dist = resolve(import.meta.dirname, '../../dist/index.mjs');
    if (!existsSync(dist)) {
      if (process.env.CI === 'true' || process.env.REQUIRE_MERMAID_DIST === '1') {
        expect.fail(
          'packages/mermaid/dist/index.mjs missing — run pnpm --filter @codemerge/mermaid build'
        );
      }
      expect(existsSync(dist)).toBe(false);
      return;
    }
    const gz = gzipSync(readFileSync(dist));
    expect(gz.length).toBeLessThan(50_000);
  });
});
