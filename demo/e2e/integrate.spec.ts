import { expect, test } from '@playwright/test';

const ADAPTERS = ['react', 'vue', 'element', 'mount', 'jquery'] as const;

test.describe('integrate stand', () => {
  for (const adapter of ADAPTERS) {
    test(`${adapter}: external→editor and editor→external`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(String(err)));

      await page.goto('/integrate.html');
      await expect(page.locator('#int-version')).not.toHaveText('unknown');
      await expect(page.locator('#ocm-version')).not.toHaveText('unknown');

      await page.locator(`#tabs button[data-adapter="${adapter}"]`).click();
      await expect(page.locator('#adapter-label')).toHaveText(adapter);
      await expect(page.locator('#status')).toHaveClass(/ok/, { timeout: 20_000 });
      await expect(page.locator('#host .ocm-toolbar').first()).toBeVisible({ timeout: 20_000 });

      await page.locator('#btn-set-b').click();
      await expect(page.locator('#external-value')).toContainText('Value B');
      await expect(page.locator('#host')).toContainText('Value B', { timeout: 10_000 });

      await page.locator('#btn-set-a').click();
      await expect(page.locator('#external-value')).toContainText('Value A');
      await expect(page.locator('#host')).toContainText('Value A', { timeout: 10_000 });

      const editable = page.locator('#host [contenteditable="true"]').first();
      await editable.click();
      await page.keyboard.type(' TYPED');
      await expect(page.locator('#external-value')).toContainText('TYPED', { timeout: 10_000 });
      await expect(page.locator('#last-event')).toContainText(`${adapter}/`);

      expect(pageErrors, `page errors (${adapter}): ${pageErrors.join('\n')}`).toEqual([]);
      await expect(page.locator('#errors')).toBeEmpty();
    });
  }
});
