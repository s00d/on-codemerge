import type { Viewport } from '../types';

const VIEWPORT_SIZES = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
  ultraWide: 1920,
  responsive: '100%',
};

const STORAGE_KEY = 'responsive-viewport';

function isViewport(value: string): value is Viewport {
  return value in VIEWPORT_SIZES;
}

export class ViewportManager {
  private currentViewport: Viewport;
  private container: HTMLElement | null = null;

  constructor() {
    // responsive по умолчанию, desktop игнорируем как дефолт
    let initial: Viewport = 'responsive';
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw !== null && savedRaw !== 'desktop' && isViewport(savedRaw)) {
        initial = savedRaw;
      }
    } catch {
      /* storage blocked (sandboxed iframe / privacy mode) */
    }
    this.currentViewport = initial;
  }

  public setViewport(container: HTMLElement, viewport: Viewport): void {
    this.container = container;
    this.currentViewport = viewport;

    try {
      localStorage.setItem(STORAGE_KEY, viewport);
    } catch {
      /* storage blocked */
    }

    const size = VIEWPORT_SIZES[viewport];

    // Добавляем анимацию перехода
    container.style.transition = 'width 0.3s ease-in-out, margin 0.3s ease-in-out';

    if (viewport === 'responsive') {
      container.style.width = '100%';
      container.style.margin = '0';
      container.style.maxWidth = 'none';
    } else {
      const width = typeof size === 'number' ? `${size}px` : size;
      container.style.width = width;
      container.style.margin = '0 auto';
      container.style.maxWidth = width;
    }
  }

  public getCurrentViewport(): Viewport {
    return this.currentViewport;
  }

  /** Plugin teardown — give the host its own sizing back. */
  public destroy(): void {
    const el = this.container;
    if (el) {
      for (const prop of ['transition', 'width', 'margin', 'max-width']) {
        el.style.removeProperty(prop);
      }
    }
    this.container = null;
  }
}
