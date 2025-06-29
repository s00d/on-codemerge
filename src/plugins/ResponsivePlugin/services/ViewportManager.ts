import type { Viewport } from '../types';

const VIEWPORT_SIZES = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
  ultraWide: 1920,
  responsive: '100%',
};

export class ViewportManager {
  private currentViewport: Viewport;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private changeHandlers: ((viewport: Viewport, width: number) => void)[] = [];

  constructor() {
    // responsive по умолчанию, desktop игнорируем как дефолт
    let initial: Viewport = 'responsive';
    const savedViewport = localStorage.getItem('responsive-viewport') as Viewport;
    if (savedViewport && savedViewport !== 'desktop' && VIEWPORT_SIZES[savedViewport as keyof typeof VIEWPORT_SIZES]) {
      initial = savedViewport;
    }
    this.currentViewport = initial;
  }

  public setViewport(container: HTMLElement, viewport: Viewport): void {
    this.container = container;
    this.currentViewport = viewport;
    
    // Сохраняем в localStorage
    localStorage.setItem('responsive-viewport', viewport);

    const size = VIEWPORT_SIZES[viewport as keyof typeof VIEWPORT_SIZES];
    
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

    // Уведомляем об изменении
    this.notifyChange(viewport, typeof size === 'number' ? size : window.innerWidth);

    // Устанавливаем ResizeObserver для responsive режима
    this.setupResizeObserver();
  }

  public getCurrentViewport(): Viewport {
    return this.currentViewport;
  }

  public getCurrentWidth(): number {
    if (!this.container) return window.innerWidth;
    return this.container.offsetWidth;
  }

  public onViewportChange(handler: (viewport: Viewport, width: number) => void): void {
    this.changeHandlers.push(handler);
  }

  private notifyChange(viewport: Viewport, width: number): void {
    this.changeHandlers.forEach(handler => handler(viewport, width));
  }

  private setupResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.currentViewport === 'responsive' && this.container) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          this.notifyChange('responsive', width);
        }
      });
      this.resizeObserver.observe(this.container);
    }
  }

  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.changeHandlers = [];
    this.container = null;
  }

  // Методы для быстрого переключения
  public nextViewport(): void {
    const viewports: Viewport[] = ['mobile', 'tablet', 'desktop', 'largeDesktop', 'ultraWide', 'responsive'];
    const currentIndex = viewports.indexOf(this.currentViewport);
    const nextIndex = (currentIndex + 1) % viewports.length;
    
    if (this.container) {
      this.setViewport(this.container, viewports[nextIndex]);
    }
  }

  public previousViewport(): void {
    const viewports: Viewport[] = ['mobile', 'tablet', 'desktop', 'largeDesktop', 'ultraWide', 'responsive'];
    const currentIndex = viewports.indexOf(this.currentViewport);
    const previousIndex = currentIndex === 0 ? viewports.length - 1 : currentIndex - 1;
    
    if (this.container) {
      this.setViewport(this.container, viewports[previousIndex]);
    }
  }
}
