import { describe, test, expect } from 'untestutils/vitest';
import { content, expectPopup, gotoEditor, toolbarClick } from './helpers/editor';

describe('toolbar menus', () => {
  test.override({ harness: 'editor' });

  test('insert menu opens and inserts table', async ({ page, goto }) => {
    await gotoEditor(page, goto);
    await expect(page.locator('.ocm-toolbar__btn[data-menu="insert"]')).toBeVisible();
    await expect(page.locator('.ocm-toolbar__btn[data-id="bold"]')).toBeVisible();
    await expect(page.locator('.ocm-toolbar__btn[data-id="table"]')).toHaveCount(0);

    await toolbarClick(page, 'table');
    const dialog = await expectPopup(page);
    await dialog.locator('.table-picker__cell').nth(0).click();
    await expect(content(page).locator('table').first()).toBeVisible();
  });
});
