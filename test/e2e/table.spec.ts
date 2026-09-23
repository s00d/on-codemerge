import { describe, test, expect } from 'untestutils/vitest';
import { content, expectPopup, gotoEditor, toolbarClick } from './helpers/editor';

describe('table', () => {
  test.override({ harness: 'editor' });

  test('inserts table and nested table from cell', async ({ page, goto }) => {
    await gotoEditor(page, goto);

    await toolbarClick(page, 'table');
    const dialog = await expectPopup(page);
    const cells = dialog.locator('.table-picker__cell');
    await expect(cells.first()).toBeVisible();
    // 2×2 → index 9 in 8-col grid is row2 col2 → index = 1*8+1 = 9
    await cells.nth(9).hover();
    await cells.nth(9).click();
    await expect(page.locator('.ocm-popup-layer')).toHaveCount(0);

    const table = content(page).locator('table').first();
    await expect(table).toBeVisible();
    const cell = table.locator('td p, th p, td, th').first();
    await cell.click();

    await toolbarClick(page, 'table');
    const nestedDialog = await expectPopup(page);
    await nestedDialog.locator('.table-picker__cell').nth(0).hover();
    await nestedDialog.locator('.table-picker__cell').nth(0).click();

    await expect(content(page).locator('table table').first()).toBeVisible({ timeout: 10_000 });
  });
});
