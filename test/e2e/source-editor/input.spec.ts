import { describe, test, expect } from 'untestutils/vitest';
import { gotoStand, textarea } from './helpers';

describe('source editor input UX', () => {
  test.override({ harness: 'sourceEditor' });

  test('Tab indent and Shift-Tab outdent keep focus', async ({ page, goto }) => {
    await gotoStand(page, goto);
    const ta = textarea(page, 'isolated');
    await ta.click();
    await ta.fill('hello');
    await ta.press('Home');
    await ta.press('Tab');
    await expect(ta).toHaveValue('  hello');
    await ta.press('Shift+Tab');
    await expect(ta).toHaveValue('hello');
    await expect(ta).toBeFocused();
  });

  test('Mod-z undoes paste-like insert via beforeinput path', async ({ page, goto }) => {
    await gotoStand(page, goto);
    const ta = textarea(page, 'isolated');
    await ta.click();
    await ta.fill('ab');
    await ta.evaluate((el) => {
      const t = el as HTMLTextAreaElement;
      t.setSelectionRange(2, 2);
      t.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertFromPaste',
          data: 'XY',
          bubbles: true,
          cancelable: true,
        })
      );
      t.setRangeText('XY', 2, 2, 'end');
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(ta).toHaveValue('abXY');
    await ta.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
    await expect(ta).toHaveValue('ab');
  });

  test('caret color stays opaque while glyphs use transparent fill', async ({ page, goto }) => {
    await gotoStand(page, goto);
    const styles = await textarea(page, 'isolated').evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        caret: cs.caretColor,
        fill: cs.webkitTextFillColor,
        color: cs.color,
      };
    });
    expect(styles.fill === 'rgba(0, 0, 0, 0)' || styles.fill === 'transparent').toBe(true);
    expect(styles.caret).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.caret).not.toBe('transparent');
  });
});
