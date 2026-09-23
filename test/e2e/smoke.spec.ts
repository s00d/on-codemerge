import { describe, test, expect } from 'untestutils/vitest';
import { content, gotoEditor, toolbar } from './helpers/editor';

describe('editor smoke', () => {
  test.override({ harness: 'editor' });

  test('boots contenteditable and toolbar', async ({ page, goto }) => {
    await gotoEditor(page, goto);
    await expect(content(page)).toBeVisible();
    await expect(toolbar(page)).toBeVisible();
    await expect(page.locator('.ocm-toolbar__btn[data-id="bold"]')).toBeVisible();
  });
});
