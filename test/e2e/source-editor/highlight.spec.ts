import { describe, test, expect } from 'untestutils/vitest';
import { gotoStand, mirrorCode, host } from './helpers';

const TOKEN_TYPES = [
  'comment',
  'string',
  'number',
  'boolean',
  'operator',
  'punctuation',
  'ident',
] as const;

describe('source editor highlight corpus', () => {
  test.override({ harness: 'sourceEditor' });

  test('isolated pane paints every allowlisted token type', async ({ page, goto }) => {
    await gotoStand(page, goto);
    await page.getByTestId('btn-corpus').click();
    const code = mirrorCode(page, 'isolated');
    await expect(code).toBeVisible();
    for (const type of TOKEN_TYPES) {
      const tok = code.locator(`.token.${type}`).first();
      await expect(tok).toBeVisible();
      const color = await tok.evaluate((el) => getComputedStyle(el).color);
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
      expect(color).not.toBe('transparent');
    }
    const text = await code.evaluate((el) => el.textContent ?? '');
    expect(text).toContain('json editor');
    expect(text).toContain('flowchart');
  });

  test('JSON raw host keeps gutter rail visible with digits', async ({ page, goto }) => {
    await gotoStand(page, goto);
    const rail = host(page, 'json').locator('.ocm-source-editor__gutter');
    const pane = host(page, 'json').locator('.ocm-source-editor__pane');
    const root = host(page, 'json').locator('.ocm-source-editor');
    await expect(rail).toBeVisible();
    const metrics = await root.evaluate((el) => {
      const r = el.querySelector('.ocm-source-editor__gutter') as HTMLElement | null;
      const p = el.querySelector('.ocm-source-editor__pane') as HTMLElement | null;
      const line = el.querySelector('.ocm-source-editor__gutter-line') as HTMLElement | null;
      const cs = getComputedStyle(el);
      return {
        display: cs.display,
        cols: cs.gridTemplateColumns,
        railW: r?.getBoundingClientRect().width ?? 0,
        railH: r?.getBoundingClientRect().height ?? 0,
        paneH: p?.getBoundingClientRect().height ?? 0,
        lineH: line?.getBoundingClientRect().height ?? 0,
        lineW: line?.getBoundingClientRect().width ?? 0,
      };
    });
    expect(metrics.display).toBe('grid');
    expect(metrics.cols).toMatch(/^\d+(\.\d+)?px\s+/);
    expect(metrics.railW).toBeGreaterThanOrEqual(36);
    expect(metrics.railH).toBeGreaterThan(40);
    expect(metrics.paneH).toBeGreaterThan(40);
    expect(Math.abs(metrics.railH - metrics.paneH)).toBeLessThanOrEqual(2);
    expect(metrics.lineH).toBeGreaterThanOrEqual(18);
    expect(metrics.lineW).toBeGreaterThan(8);
    const lines = host(page, 'json').locator('.ocm-source-editor__gutter-line');
    await expect(lines.first()).toBeVisible();
    await expect(lines.first()).toHaveAttribute('data-line', '1');
    const count = await lines.count();
    expect(count).toBeGreaterThanOrEqual(5);
    await expect(pane).toBeVisible();
  });
});
