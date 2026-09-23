import type { Page } from '@playwright/test';

/** Wait for the live editor chrome to be interactive. */
export async function gotoEditor(
  page: Page,
  goto: (url: string, opts?: object) => Promise<unknown>
) {
  await goto('/', { waitUntil: 'load' });
  await page.waitForSelector('.ocm-content[contenteditable="true"]', { timeout: 60_000 });
  await page.waitForSelector('.ocm-toolbar[role="toolbar"]', { timeout: 30_000 });
}

export function content(page: Page) {
  return page.locator('.ocm-content[contenteditable="true"]').first();
}

export function toolbar(page: Page) {
  return page.locator('.ocm-toolbar[role="toolbar"]').first();
}

export function toolbarButton(page: Page, id: string) {
  return page.locator(`.ocm-toolbar[role="toolbar"] > .ocm-toolbar__btn[data-id="${id}"]`).first();
}

export async function toolbarClick(page: Page, id: string) {
  const closeMenus = async () => {
    if ((await page.locator('[data-ocm-toolbar-menu]').count()) > 0) {
      await page.keyboard.press('Escape');
      await page
        .locator('[data-ocm-toolbar-menu]')
        .waitFor({ state: 'detached', timeout: 2000 })
        .catch(() => {});
    }
  };

  await closeMenus();

  const direct = toolbarButton(page, id);
  if (await direct.isVisible().catch(() => false)) {
    await direct.click();
    return;
  }

  // Overflow menus: try insert → review → tools
  for (const menuId of ['insert', 'review', 'tools'] as const) {
    await closeMenus();
    const trigger = page.locator(`.ocm-toolbar__btn[data-menu="${menuId}"]`).first();
    if (!(await trigger.isVisible().catch(() => false))) {
      continue;
    }
    await trigger.click();
    const item = page.locator(`[data-ocm-toolbar-menu="${menuId}"] [data-id="${id}"]`).first();
    try {
      await item.waitFor({ state: 'visible', timeout: 2000 });
      await item.click();
      return;
    } catch {
      await closeMenus();
    }
  }

  await direct.click();
}

/** Overlay and dialog are siblings under `.ocm-popup-layer`. */
export function popupLayer(page: Page) {
  return page.locator('.ocm-popup-layer').first();
}

export function popupDialog(page: Page) {
  return page.locator('.ocm-popup[role="dialog"]').first();
}

export function popupOverlay(page: Page) {
  return page.locator('.ocm-popup-overlay').first();
}

export async function expectPopup(page: Page) {
  const dialog = popupDialog(page);
  await dialog.waitFor({ state: 'visible', timeout: 10_000 });
  return dialog;
}

export async function typeInEditor(page: Page, text: string) {
  const el = content(page);
  await el.click();
  await page.keyboard.type(text, { delay: 15 });
}

export async function selectAllInEditor(page: Page) {
  await content(page).click();
  const mod = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${mod}+A`);
}

/** Fill a popup field by its `id` (matches PopupService input attrs). */
export async function fillPopupInput(page: Page, id: string, value: string) {
  const input = page.locator(`#${id}`).first();
  await input.waitFor({ state: 'visible', timeout: 10_000 });
  await input.fill(value);
}

/** Click a labeled button in the active popup footer (or dialog). */
export async function clickPopupButton(page: Page, name: string | RegExp) {
  const dialog = popupDialog(page);
  await dialog.getByRole('button', { name }).click();
}
