import { describe, test, expect } from 'untestutils/vitest';
import { expectPopup, gotoEditor, sheetCell, toolbarClick } from './helpers/editor';

describe('context menu', () => {
  test.override({ harness: 'editor' });

  test('opens fixed near table cell click and stays put on scroll', async ({ page, goto }) => {
    await gotoEditor(page, goto);

    await toolbarClick(page, 'table');
    const dialog = await expectPopup(page);
    await dialog.locator('.table-picker__cell').nth(9).hover();
    await dialog.locator('.table-picker__cell').nth(9).click();

    const cell = sheetCell(page);
    await expect(cell).toBeVisible();
    const box = await cell.boundingBox();
    expect(box).toBeTruthy();
    const x = (box?.x ?? 0) + (box?.width ?? 10) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 10) / 2;

    await page.mouse.click(x, y, { button: 'right' });
    const menu = page.locator('.ocm-context-menu').first();
    await expect(menu).toBeVisible({ timeout: 5000 });
    await expect(menu.getByRole('menuitem', { name: /Insert/i })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /Delete/i })).toBeVisible();
    await menu.getByRole('menuitem', { name: /Insert/i }).hover();
    await expect(
      page
        .locator('.ocm-menu-subwrap__panel:not([hidden])')
        .getByText(/Row Above|Row Below/i)
        .first()
    ).toBeVisible({
      timeout: 3000,
    });

    const before = await menu.evaluate((node) => {
      const s = getComputedStyle(node);
      return { position: s.position, top: s.top, left: s.left };
    });
    expect(before.position).toBe('fixed');

    await page.evaluate(() => {
      window.scrollBy(0, 120);
    });
    const stillVisible = await menu.isVisible().catch(() => false);
    if (stillVisible) {
      const after = await menu.evaluate((node) => {
        const s = getComputedStyle(node);
        return { top: s.top, left: s.left };
      });
      expect(after.top).toBe(before.top);
      expect(after.left).toBe(before.left);
    } else {
      await expect(page.locator('.ocm-context-menu')).toHaveCount(0);
    }
  });
});
