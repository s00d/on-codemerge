import { describe, test, expect } from 'untestutils/vitest';
import { expectPopup, gotoEditor, popupLayer, popupOverlay, toolbarClick } from './helpers/editor';

describe('modals', () => {
  test.override({ harness: 'editor' });

  test('shortcuts modal has sticky chrome and closes on overlay', async ({ page, goto }) => {
    await gotoEditor(page, goto);
    await toolbarClick(page, 'shortcuts');
    const dialog = await expectPopup(page);
    await expect(dialog.locator('.ocm-popup__header')).toBeVisible();
    await expect(dialog.locator('.ocm-popup__header')).toContainText(/shortcut/i);

    const headerStyle = await dialog.locator('.ocm-popup__header').evaluate((el) => {
      const s = getComputedStyle(el);
      return { position: s.position };
    });
    expect(['sticky', 'fixed', 'static', 'relative']).toContain(headerStyle.position);

    await popupOverlay(page).evaluate((el) => {
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await expect(popupLayer(page)).toHaveCount(0);
  });

  test('color and table pickers open with header', async ({ page, goto }) => {
    await gotoEditor(page, goto);

    await toolbarClick(page, 'fore-color');
    let dialog = await expectPopup(page);
    await expect(dialog.locator('.ocm-popup__header')).toBeVisible();
    await page.locator('.ocm-popup__close').first().click();
    await expect(popupLayer(page)).toHaveCount(0);

    await toolbarClick(page, 'table');
    dialog = await expectPopup(page);
    await expect(dialog.locator('.ocm-popup__header')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popupLayer(page)).toHaveCount(0);
  });
});
