import { describe, test, expect } from 'untestutils/vitest';
import { content, gotoEditor, toolbarClick, typeInEditor } from './helpers/editor';

describe('typing', () => {
  test.override({ harness: 'editor' });

  test('types text and undoes/redoes', async ({ page, goto }) => {
    await gotoEditor(page, goto);
    await typeInEditor(page, 'hello vitest');
    await expect(content(page)).toContainText('hello vitest');

    await toolbarClick(page, 'undo');
    await expect(content(page)).not.toContainText('hello vitest');

    await toolbarClick(page, 'redo');
    await expect(content(page)).toContainText('hello vitest');
  });
});
