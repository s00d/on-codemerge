import { expect, test } from '@playwright/test';

test.describe('demo stand', () => {
  test('wysiwyg boots, CSS, APIs, and live published preview', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/');

    await expect(page.getByTestId('editor-host')).toBeVisible();
    await expect(page.locator('#pkg-version')).toContainText(/version:/);
    await expect(page.locator('#css-ok')).toContainText('ocm-toolbar OK');
    await expect(page.locator('#exports-ok')).toContainText('Editor/plugins OK');
    await expect(page.locator('#mode-label')).toContainText('wysiwyg');

    const toolbar = page.locator('.ocm-toolbar').first();
    await expect(toolbar).toBeVisible({ timeout: 15_000 });

    const frame = page.frameLocator('[data-testid="publish"]');
    await expect(frame.locator('body')).toContainText('on-codemerge', { timeout: 10_000 });

    await page.getByTestId('btn-set-html').click();
    await expect(frame.locator('body')).toContainText('Sample', { timeout: 10_000 });
    await expect(frame.locator('table')).toBeVisible();

    await page.getByTestId('btn-html').click();
    await expect(page.getByTestId('output')).toContainText('Sample');

    await page.getByTestId('btn-json').click();
    await expect(page.getByTestId('output')).toContainText('"type"');

    await page.getByTestId('btn-md').click();
    await expect(page.getByTestId('output')).toContainText('Sample');

    await page.getByTestId('btn-publish').click();
    await expect(page.getByTestId('output')).toContainText('Published document');
    await expect(page.getByTestId('output')).toContainText('public.css');
    await expect(frame.locator('body')).toContainText('Sample');

    expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
    await expect(page.locator('#errors')).toBeEmpty();
  });

  test('switches across all product modes', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/');
    await expect(page.getByTestId('mode-wysiwyg')).toBeVisible();
    await expect(page.locator('#exports-ok')).toContainText('all modes');

    await page.getByTestId('mode-wysiwyg-page').click();
    await expect(page.locator('#mode-label')).toContainText('wysiwyg-page');
    await expect(page.getByTestId('actions-wysiwyg')).toBeVisible();
    await expect(page.getByTestId('output')).toContainText('page');

    await page.getByTestId('mode-json').click();
    await expect(page.locator('#mode-label')).toContainText('json');
    await expect(page.getByTestId('actions-json')).toBeVisible();
    await expect(page.locator('.ocm-toolbar').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('output')).toContainText('hello');
    await page.getByTestId('btn-json-sample').click();
    await expect(page.getByTestId('output')).toContainText('json editor');

    await page.getByTestId('mode-markdown').click();
    await expect(page.locator('#mode-label')).toContainText('markdown');
    await expect(page.getByTestId('actions-markdown')).toBeVisible();
    await expect(page.locator('.ocm-toolbar').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('output')).toContainText('Markdown editor');
    await page.getByTestId('btn-md-text').click();
    await expect(page.getByTestId('output')).toContainText('Markdown editor');

    await page.getByTestId('mode-code').click();
    await expect(page.locator('#mode-label')).toContainText('code');
    await expect(page.getByTestId('actions-code')).toBeVisible();
    await expect(page.locator('.ocm-toolbar').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('output')).toContainText('Code editor demo');
    await expect(page.locator('.ocm-source-editor .token.comment').first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('btn-code-sample').click();
    await expect(page.getByTestId('output')).toContainText('greet');
    await expect(page.locator('.ocm-source-editor .token.string').first()).toBeVisible();

    await page.getByTestId('mode-forms').click();
    await expect(page.locator('#mode-label')).toContainText('forms');
    await expect(page.getByTestId('actions-forms')).toBeVisible();
    await expect(page.locator('.ocm-toolbar').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('output')).toContainText('demo-contact');

    await page.getByTestId('mode-charts').click();
    await expect(page.locator('#mode-label')).toContainText('charts');
    await expect(page.getByTestId('actions-charts')).toBeVisible();
    await expect(page.locator('.ocm-toolbar').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('output')).toContainText('Sales');

    await page.getByTestId('mode-calendar').click();
    await expect(page.locator('#mode-label')).toContainText('calendar');
    await expect(page.getByTestId('actions-calendar')).toBeVisible();
    await expect(page.locator('.ocm-toolbar').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('output')).toContainText('Team calendar');

    await page.getByTestId('mode-tables').click();
    await expect(page.locator('#mode-label')).toContainText('tables');
    await expect(page.getByTestId('actions-tables')).toBeVisible();
    await expect(page.locator('.ocm-toolbar').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('output')).toContainText('Apples');
    await page.getByTestId('btn-tables-sample').click();
    await expect(page.getByTestId('output')).toContainText('Bananas');

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
