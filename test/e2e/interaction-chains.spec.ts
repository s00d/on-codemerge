import { describe, test, expect } from 'untestutils/vitest';
import {
  clickPopupButton,
  content,
  expectPopup,
  fillPopupInput,
  gotoEditor,
  selectAllInEditor,
  toolbarClick,
  typeInEditor,
} from './helpers/editor';

/**
 * Product gates: click → UI → document/DOM change (not chrome-only open/close).
 */
describe('interaction chains', () => {
  test.override({ harness: 'editor' });

  test('link: select → popup → fill URL → Insert → anchor in content', async ({ page, goto }) => {
    await gotoEditor(page, goto);
    await typeInEditor(page, 'linked');
    await selectAllInEditor(page);

    await toolbarClick(page, 'link');
    await expectPopup(page);
    await fillPopupInput(page, 'link-url', 'https://example.com/chain');
    await clickPopupButton(page, /Insert/i);

    const anchor = content(page).locator('a[href="https://example.com/chain"]');
    await expect(anchor).toBeVisible({ timeout: 10_000 });
    await expect(anchor).toContainText('linked');
  });

  test('table context menu: Insert → Row Below mutates row count', async ({ page, goto }) => {
    await gotoEditor(page, goto);

    await toolbarClick(page, 'table');
    const dialog = await expectPopup(page);
    // Same picker cell as table/context-menu specs (2×2 in 8-col grid → index 9)
    await dialog.locator('.table-picker__cell').nth(9).click();

    const table = content(page).locator('table').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
    const rowsBefore = await table.locator('tr').count();
    expect(rowsBefore).toBeGreaterThanOrEqual(1);

    const cell = table.locator('td p, th p, td, th').first();
    const box = await cell.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click((box?.x ?? 0) + 4, (box?.y ?? 0) + 4, { button: 'right' });

    const menu = page.locator('.ocm-context-menu').first();
    await expect(menu).toBeVisible({ timeout: 5000 });
    await menu.getByRole('menuitem', { name: /Insert/i }).hover();
    await page
      .locator('.ocm-menu-subwrap__panel:not([hidden])')
      .getByText(/Row Below/i)
      .first()
      .click();

    await expect(table.locator('tr')).toHaveCount(rowsBefore + 1, { timeout: 10_000 });
  });

  test('list: toolbar bullet → Enter splits into two items', async ({ page, goto }) => {
    await gotoEditor(page, goto);
    await typeInEditor(page, 'abcdef');
    await selectAllInEditor(page);
    await toolbarClick(page, 'list-bullet');

    const list = content(page).locator('ul').first();
    await expect(list).toBeVisible({ timeout: 10_000 });
    await expect(list.locator('li')).toHaveCount(1);

    // Place caret in the middle of the item text, then Enter to split
    const item = list.locator('li').first();
    await item.click();
    await page.keyboard.press('Home');
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.press('Enter');

    await expect(list.locator('li')).toHaveCount(2, { timeout: 10_000 });
  });
});
