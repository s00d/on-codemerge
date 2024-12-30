import type { Viewport } from '../types';

const VIEWPORT_SIZES = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  responsive: '100%',
};

export class ViewportManager {
  public setViewport(container: HTMLElement, viewport: Viewport): void {
    const size = VIEWPORT_SIZES[viewport as keyof typeof VIEWPORT_SIZES];
    container.style.width = typeof size === 'number' ? `${size}px` : size;
    container.style.margin = viewport === 'responsive' ? '0' : '0 auto';
  }
}
