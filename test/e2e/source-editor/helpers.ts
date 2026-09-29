import type { Locator, Page } from '@playwright/test';
import { expect } from 'untestutils/vitest';

export async function gotoStand(
  page: Page,
  goto: (url: string, opts?: object) => Promise<unknown>
): Promise<void> {
  await goto('/', { waitUntil: 'load' });
  await page.waitForSelector('[data-testid="status"]', { timeout: 60_000 });
  await expect(page.getByTestId('status')).toHaveText(/ready|corpus/, { timeout: 30_000 });
  await page.waitForSelector('[data-testid="host-isolated"] .ocm-source-editor', {
    timeout: 30_000,
  });
}

export function host(page: Page, which: 'isolated' | 'json' | 'md'): Locator {
  return page.getByTestId(`host-${which}`);
}

export function editorRoot(page: Page, which: 'isolated' | 'json' | 'md'): Locator {
  return host(page, which).locator('.ocm-source-editor').first();
}

export function textarea(page: Page, which: 'isolated' | 'json' | 'md'): Locator {
  return editorRoot(page, which).locator('.ocm-source-editor__input');
}

export function gutterRail(page: Page, which: 'isolated' | 'json' | 'md'): Locator {
  return editorRoot(page, which).locator('.ocm-source-editor__gutter');
}

export function gutterLine(page: Page, which: 'isolated' | 'json' | 'md', n: number): Locator {
  return editorRoot(page, which).locator(`.ocm-source-editor__gutter-line[data-line="${n}"]`);
}

export function mirrorCode(page: Page, which: 'isolated' | 'json' | 'md'): Locator {
  return editorRoot(page, which).locator('.ocm-source-editor__code');
}

/** Align gutter line N top with mirror text line N (1-based); tolerate 1px subpixel. */
export async function expectGutterAligned(
  page: Page,
  which: 'isolated' | 'json' | 'md',
  line: number,
  tol = 1.5
): Promise<void> {
  const sel = `[data-testid="host-${which}"] .ocm-source-editor`;
  const delta = await page.evaluate(
    ({ rootSel, n }) => {
      const root = document.querySelector(rootSel);
      if (!(root instanceof HTMLElement)) {
        return Number.POSITIVE_INFINITY;
      }
      const gut = root.querySelector(`.ocm-source-editor__gutter-line[data-line="${n}"]`);
      const mirror = root.querySelector('.ocm-source-editor__mirror');
      if (!(gut instanceof HTMLElement) || !(mirror instanceof HTMLElement)) {
        return Number.POSITIVE_INFINITY;
      }
      const lh = 20;
      const pad = 4;
      const expectedTop =
        mirror.getBoundingClientRect().top + pad + (n - 1) * lh - mirror.scrollTop;
      return Math.abs(gut.getBoundingClientRect().top - expectedTop);
    },
    { rootSel: sel, n: line }
  );
  expect(delta).toBeLessThanOrEqual(tol);
}

export async function scrollHost(
  page: Page,
  which: 'isolated' | 'json' | 'md',
  mode: 'end' | 'mid' | 'start'
): Promise<void> {
  const sel = `[data-testid="host-${which}"]`;
  await page.evaluate(
    ({ rootSel, m }) => {
      const ta = document.querySelector(`${rootSel} .ocm-source-editor__input`);
      if (!(ta instanceof HTMLTextAreaElement)) {
        return;
      }
      const max = Math.max(0, ta.scrollHeight - ta.clientHeight);
      ta.scrollTop = m === 'end' ? max : m === 'mid' ? Math.floor(max / 2) : 0;
      ta.dispatchEvent(new Event('scroll'));
    },
    { rootSel: sel, m: mode }
  );
  await page.waitForTimeout(50);
}

export async function setScrollLeft(
  page: Page,
  which: 'isolated' | 'json' | 'md',
  left: number
): Promise<void> {
  const sel = `[data-testid="host-${which}"]`;
  await page.evaluate(
    ({ rootSel, l }) => {
      const ta = document.querySelector(`${rootSel} .ocm-source-editor__input`);
      if (!(ta instanceof HTMLTextAreaElement)) {
        return;
      }
      ta.scrollLeft = l;
      ta.dispatchEvent(new Event('scroll'));
    },
    { rootSel: sel, l: left }
  );
}
