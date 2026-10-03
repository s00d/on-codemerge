import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allChartTypes } from '../drivers/registry';
import { renderChart } from '../drivers/renderChart';
import { isMermaidChartType } from '../drivers/toMermaidSource';

const i18n = { t: (k: string) => k };

describe('renderChart.smoke', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      const ctx = {
        scale: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn(() => ({ width: 40 })),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        translate: vi.fn(),
        rotate: vi.fn(),
        setLineDash: vi.fn(),
        quadraticCurveTo: vi.fn(),
        font: '',
        lineJoin: '',
        lineCap: '',
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        textAlign: 'left',
        textBaseline: 'alphabetic',
      };
      return ctx as unknown as CanvasRenderingContext2D;
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.toDataURL = vi.fn(
      () => 'data:image/png;base64,AAAA'
    ) as unknown as typeof HTMLCanvasElement.prototype.toDataURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders every chart type without throw', () => {
    for (const type of allChartTypes()) {
      const img = renderChart(type, [], { width: 400, height: 240, title: type }, i18n);
      expect(img).toBeInstanceOf(HTMLImageElement);
      expect(img.className).toContain('svg-chart');
      if (isMermaidChartType(type)) {
        expect(img.src).toContain('image/svg+xml');
      } else {
        expect(img.src.startsWith('data:image/png')).toBe(true);
      }
    }
  });
});
