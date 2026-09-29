import { describe, test, expect } from 'untestutils/vitest';
import {
  gotoStand,
  expectGutterAligned,
  scrollHost,
  setScrollLeft,
  gutterRail,
  textarea,
  editorRoot,
} from './helpers';

describe('source editor gutter scroll sync', () => {
  test.override({ harness: 'sourceEditor' });

  test('aligns gutter at start mid and end without flicker', async ({ page, goto }) => {
    await gotoStand(page, goto);
    await page.getByTestId('btn-long').click();
    await expect(page.getByTestId('status')).toHaveText('long');
    await page.waitForTimeout(100);

    for (const which of ['isolated', 'json', 'md'] as const) {
      await scrollHost(page, which, 'start');
      await expectGutterAligned(page, which, 1);

      await scrollHost(page, which, 'mid');
      await expectGutterAligned(page, which, 20);

      await scrollHost(page, which, 'end');
      const lineCount = await editorRoot(page, which)
        .locator('.ocm-source-editor__gutter-line')
        .count();
      // Last non-empty-ish line — avoid trailing blank line edge in some browsers.
      const probe = Math.max(1, lineCount - 1);
      await expectGutterAligned(page, which, probe);
      // Second sample — no 26↔27 style oscillation at max scroll.
      await page.waitForTimeout(40);
      await expectGutterAligned(page, which, probe);
      const transformA = await editorRoot(page, which)
        .locator('.ocm-source-editor__gutter-inner')
        .evaluate((el) => (el as HTMLElement).style.transform);
      await page.waitForTimeout(40);
      const transformB = await editorRoot(page, which)
        .locator('.ocm-source-editor__gutter-inner')
        .evaluate((el) => (el as HTMLElement).style.transform);
      expect(transformA).toBe(transformB);
    }
  });

  test('horizontal scroll moves mirror not gutter X', async ({ page, goto }) => {
    await gotoStand(page, goto);
    await page.getByTestId('btn-long').click();
    const which = 'isolated' as const;
    const railBefore = await gutterRail(page, which).boundingBox();
    await setScrollLeft(page, which, 120);
    const mirrorLeft = await page.evaluate(() => {
      const m = document.querySelector(
        '[data-testid="host-isolated"] .ocm-source-editor__mirror'
      ) as HTMLElement | null;
      return m?.scrollLeft ?? -1;
    });
    const taLeft = await textarea(page, which).evaluate(
      (el) => (el as HTMLTextAreaElement).scrollLeft
    );
    expect(mirrorLeft).toBe(taLeft);
    expect(mirrorLeft).toBeGreaterThan(0);
    const railAfter = await gutterRail(page, which).boundingBox();
    expect(railAfter!.x).toBeCloseTo(railBefore!.x, 0);
  });
});
