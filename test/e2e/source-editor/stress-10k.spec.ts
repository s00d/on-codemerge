import { describe, test, expect } from 'untestutils/vitest';
import { gotoStand, expectGutterAligned, scrollHost, editorRoot, gutterRail } from './helpers';

describe('source editor 10k+ stress', () => {
  test.override({ harness: 'sourceEditor' });

  test('12k lines: virtual gutter, scroll sync, no DOM bomb', async ({ page, goto }) => {
    await gotoStand(page, goto);
    await page.getByTestId('btn-huge').click();
    await expect(page.getByTestId('status')).toHaveText(/^huge:12000:\d+ms$/, {
      timeout: 60_000,
    });

    const status = await page.getByTestId('status').innerText();
    const ms = Number(/huge:12000:(\d+)ms/.exec(status)?.[1] ?? '999999');
    // Mount three panes of 12k must stay interactive (CI headroom).
    expect(ms).toBeLessThan(15_000);

    for (const which of ['isolated', 'json', 'md'] as const) {
      const meta = await editorRoot(page, which).evaluate((root) => {
        const lines = root.querySelectorAll('.ocm-source-editor__gutter-line');
        const ta = root.querySelector('.ocm-source-editor__input');
        const code = root.querySelector('.ocm-source-editor__code');
        return {
          gutterNodes: lines.length,
          firstLine: lines[0]?.getAttribute('data-line') ?? '',
          taLen: ta instanceof HTMLTextAreaElement ? ta.value.split('\n').length : 0,
          codeChildren: code?.childNodes.length ?? 0,
          railW:
            root.querySelector('.ocm-source-editor__gutter')?.getBoundingClientRect().width ?? 0,
        };
      });

      expect(meta.taLen).toBeGreaterThanOrEqual(10_000);
      expect(meta.gutterNodes).toBeGreaterThan(5);
      expect(meta.gutterNodes).toBeLessThan(120);
      expect(meta.railW).toBeGreaterThan(20);
      // Highlight caps → plain text (few nodes), not 10k token spans.
      expect(meta.codeChildren).toBeLessThan(50);

      await scrollHost(page, which, 'start');
      await expectGutterAligned(page, which, 1);

      await scrollHost(page, which, 'mid');
      const midLine = await editorRoot(page, which)
        .locator('.ocm-source-editor__gutter-line')
        .first()
        .getAttribute('data-line');
      expect(Number(midLine)).toBeGreaterThan(100);
      await expectGutterAligned(page, which, Number(midLine));

      await scrollHost(page, which, 'end');
      const endFirst = await editorRoot(page, which)
        .locator('.ocm-source-editor__gutter-line')
        .first()
        .getAttribute('data-line');
      const endLast = await editorRoot(page, which)
        .locator('.ocm-source-editor__gutter-line')
        .last()
        .getAttribute('data-line');
      expect(Number(endLast)).toBeGreaterThanOrEqual(10_000);
      expect(Number(endFirst)).toBeGreaterThan(9_000);
      await expectGutterAligned(page, which, Number(endLast));

      const tA = await editorRoot(page, which)
        .locator('.ocm-source-editor__gutter-inner')
        .evaluate((el) => (el instanceof HTMLElement ? el.style.transform : ''));
      await page.waitForTimeout(50);
      const tB = await editorRoot(page, which)
        .locator('.ocm-source-editor__gutter-inner')
        .evaluate((el) => (el instanceof HTMLElement ? el.style.transform : ''));
      expect(tA).toBe(tB);
    }

    // Digits column grew for 5-digit line numbers.
    const railBox = await gutterRail(page, 'isolated').boundingBox();
    expect(railBox!.width).toBeGreaterThan(28);
  });
});
