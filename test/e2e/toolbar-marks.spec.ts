import { describe, test, expect } from 'untestutils/vitest';
import {
  content,
  expectPopup,
  gotoEditor,
  popupLayer,
  selectAllInEditor,
  toolbarClick,
  typeInEditor,
} from './helpers/editor';

describe('toolbar marks', () => {
  test.override({ harness: 'editor' });

  test('bold toggles on then off', async ({ page, goto }) => {
    await gotoEditor(page, goto);
    await typeInEditor(page, 'marked');
    await selectAllInEditor(page);

    await toolbarClick(page, 'bold');
    const afterBold = await content(page).innerHTML();
    expect(afterBold.toLowerCase()).toMatch(/strong|b\b|font-weight:\s*(bold|700)|data-mark/);

    // Keep selection and toggle off — text must not stay bold
    await selectAllInEditor(page);
    await toolbarClick(page, 'bold');
    const afterOff = await content(page).innerHTML();
    expect(afterOff.toLowerCase()).not.toMatch(
      /<strong\b|<b\b|font-weight:\s*(bold|700)|data-mark=["']?bold/
    );
    expect(afterOff.toLowerCase()).toContain('marked');
  });

  test('italic and link popup', async ({ page, goto }) => {
    await gotoEditor(page, goto);
    await typeInEditor(page, 'marked');
    await selectAllInEditor(page);

    await toolbarClick(page, 'italic');
    await toolbarClick(page, 'link');
    const dialog = await expectPopup(page);
    await expect(dialog.locator('.ocm-popup__header')).toContainText(/link/i);
    await page.locator('.ocm-popup__close').first().click();
    await expect(popupLayer(page)).toHaveCount(0);
  });
});
