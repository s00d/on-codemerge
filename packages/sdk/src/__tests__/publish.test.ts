import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PublishRuntimeRegistry,
  composePublishedDocument,
  neededRuntimeIds,
  readOcmConfig,
  publishedCssHref,
  publishedJsHref,
  definePublishRuntime,
} from '../publish';
import { PUBLISHED_CONTENT_CLASS } from '../ui/chrome';

describe('publish registry', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('neededRuntimeIds scans html and dom', () => {
    expect.hasAssertions();
    expect(neededRuntimeIds('<p>x</p>')).toStrictEqual([]);
    expect(
      neededRuntimeIds(
        '<div data-ocm-runtime="timer"></div><div data-ocm-runtime="timer"></div><div data-ocm-runtime="calendar-reminders"></div>'
      )
    ).toStrictEqual(['calendar-reminders', 'timer']);

    const host = document.createElement('div');
    host.innerHTML = '<span data-ocm-runtime="timer"></span>';
    document.body.append(host);
    expect(neededRuntimeIds(host)).toStrictEqual(['timer']);
  });

  it('composePublishedDocument omits script when jsHref null', () => {
    expect.hasAssertions();
    const doc = composePublishedDocument({
      bodyHtml: '<p>Hi</p>',
      cssHref: publishedCssHref(),
      jsHref: null,
    });
    expect(doc).toContain(PUBLISHED_CONTENT_CLASS);
    expect(doc).toContain(publishedCssHref());
    expect(doc).not.toContain('public.js');
    expect(doc).toContain('<p>Hi</p>');

    const withJs = composePublishedDocument({
      bodyHtml: '<div data-ocm-runtime="timer"></div>',
      cssHref: publishedCssHref(),
      jsHref: publishedJsHref(),
    });
    expect(withJs).toContain('public.js');
  });

  it('boot mounts once and cleanup unboots', () => {
    expect.hasAssertions();
    const mounts: HTMLElement[] = [];
    const registry = new PublishRuntimeRegistry();
    registry.register(
      definePublishRuntime({
        id: 'timer',
        mount(el) {
          mounts.push(el);
          return () => {
            delete el.dataset.mounted;
          };
        },
      })
    );
    const el = document.createElement('div');
    el.dataset.ocmRuntime = 'timer';
    el.dataset.ocmConfig = '{"target":"2099-01-01T00:00:00.000Z"}';
    document.body.append(el);

    expect(readOcmConfig(el)).toStrictEqual({ target: '2099-01-01T00:00:00.000Z' });
    registry.boot(document);
    expect(mounts).toHaveLength(1);
    expect(el.dataset.ocmBooted).toBe('1');
    registry.boot(document);
    expect(mounts).toHaveLength(1);

    registry.unboot(document);
    expect(el.dataset.ocmBooted).toBeUndefined();
  });
});

describe('timer runtime', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('ticks countdown and expires', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    const { runtime } = await import('../../../../src/plugins/TimerPlugin/publish/runtime');
    const registry = new PublishRuntimeRegistry();
    registry.register(runtime);

    const root = document.createElement('div');
    root.dataset.ocmRuntime = 'timer';
    root.dataset.ocmConfig = JSON.stringify({
      target: new Date(Date.now() + 2500).toISOString(),
      expiredText: 'Done',
    });
    root.innerHTML = `
      <div class="timer-countdown">
        <span class="timer-days">0</span>
        <span class="timer-hours">00</span>
        <span class="timer-minutes">00</span>
        <span class="timer-seconds">00</span>
      </div>
    `;
    document.body.append(root);
    registry.boot(document);

    expect(root.querySelector('.timer-seconds')?.textContent).toBe('02');
    vi.advanceTimersByTime(3000);
    expect(root.querySelector('.timer-expired')?.textContent).toBe('Done');
  });
});

describe('calendar-reminders runtime', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('fires with fresh Date.now on poll', async () => {
    expect.hasAssertions();
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    const { runtime } = await import('../../../../src/plugins/CalendarPlugin/publish/runtime');
    const registry = new PublishRuntimeRegistry();
    registry.register(runtime);

    const root = document.createElement('div');
    root.dataset.ocmRuntime = 'calendar-reminders';
    root.dataset.ocmConfig = JSON.stringify({
      reminders: [{ id: 'r1', triggerTime: now + 5000, message: 'Soon' }],
      pollMs: 1000,
      dismissMs: 60_000,
    });
    document.body.append(root);
    registry.boot(document);
    expect(document.querySelector('.calendar-reminder')).toBeNull();

    vi.advanceTimersByTime(6000);
    expect(document.querySelector('.reminder-message')?.textContent).toBe('Soon');
  });
});
