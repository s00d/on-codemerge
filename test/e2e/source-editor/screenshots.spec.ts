import { describe, test, expect } from 'untestutils/vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gotoStand, editorRoot, scrollHost } from './helpers';

const shotsDir = join(dirname(fileURLToPath(import.meta.url)), '__screenshots__');

function assertShot(
  name: string,
  png: Buffer,
  update = process.env.UPDATE_SOURCE_SHOTS === '1'
): void {
  const path = join(shotsDir, name);
  if (update || !existsSync(path)) {
    mkdirSync(shotsDir, { recursive: true });
    writeFileSync(path, png);
    expect(png.byteLength).toBeGreaterThan(500);
    return;
  }
  const golden = readFileSync(path);
  if (!png.equals(golden)) {
    const ratio = Math.abs(png.byteLength - golden.byteLength) / golden.byteLength;
    expect(ratio).toBeLessThan(0.25);
  }
}

describe('source editor screenshots', () => {
  test.override({ harness: 'sourceEditor' });

  test('visual baselines for corpus and scrolled end', async ({ page, goto }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoStand(page, goto);
    await page.getByTestId('btn-corpus').click();
    await expect(page.getByTestId('status')).toHaveText('corpus');
    await page.waitForTimeout(100);

    assertShot(
      'isolated-corpus.png',
      await editorRoot(page, 'isolated').screenshot({ animations: 'disabled' })
    );
    assertShot(
      'json-raw-corpus.png',
      await editorRoot(page, 'json').screenshot({ animations: 'disabled' })
    );
    assertShot(
      'md-source-corpus.png',
      await editorRoot(page, 'md').screenshot({ animations: 'disabled' })
    );

    await page.getByTestId('btn-long').click();
    await page.waitForTimeout(100);
    await scrollHost(page, 'isolated', 'end');
    assertShot(
      'isolated-scroll-end.png',
      await editorRoot(page, 'isolated').screenshot({ animations: 'disabled' })
    );
  });
});
