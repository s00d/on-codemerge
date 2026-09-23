import { expect, test } from '@playwright/test';

test.describe('npm demo stand', () => {
  test('boots editor with package CSS and core APIs', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/');

    await expect(page.getByTestId('editor-host')).toBeVisible();
    await expect(page.locator('#pkg-version')).toContainText(/version:/);
    await expect(page.locator('#css-ok')).toContainText('ocm-toolbar OK');
    await expect(page.locator('#exports-ok')).toContainText('Editor/plugins OK');

    // Toolbar chrome from index.css (not unstyled icon soup)
    const toolbar = page.locator('.ocm-toolbar, [data-ocm-toolbar]').first();
    await expect(toolbar).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('btn-set-html').click();
    await page.getByTestId('btn-html').click();
    await expect(page.getByTestId('output')).toContainText('Sample');

    await page.getByTestId('btn-json').click();
    await expect(page.getByTestId('output')).toContainText('"type"');

    await page.getByTestId('btn-md').click();
    await expect(page.getByTestId('output')).toContainText('Sample');

    await page.getByTestId('btn-publish').click();
    const frame = page.frameLocator('[data-testid="publish"]');
    await expect(frame.locator('body')).toContainText('Sample', { timeout: 10_000 });

    expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
    await expect(page.locator('#errors')).toBeEmpty();
  });

  test('bold toggle does not throw', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('editor-host')).toBeVisible();
    await page.getByTestId('btn-bold').click();
    await expect(page.locator('#errors')).toBeEmpty();
  });
});
