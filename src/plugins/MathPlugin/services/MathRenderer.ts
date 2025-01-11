import { mathjax } from 'mathjax-full/js/mathjax';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import type { MathExpression } from '../types';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({ packages: ['base', 'ams'] });
const svg = new SVG({ fontCache: 'local' });
const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

export class MathRenderer {
  public renderMath(
    expression: MathExpression,
    options: { width: number; height: number }
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    try {
      // Генерация SVG с помощью MathJax
      const node = html.convert(expression, { display: true });
      const fullString = adaptor.outerHTML(node);

      // Извлечение чистого SVG
      const svgMatch = fullString.match(/<svg[^>]*>[\s\S]*<\/svg>/);
      if (!svgMatch) {
        throw new Error('Invalid SVG structure');
      }

      const svgString = svgMatch[0];

      // Используем DOMParser для парсинга SVG
      const parser = new DOMParser();
      const svgDocument = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDocument.documentElement;

      // Преобразуем SVG в Blob и создаем URL
      const data = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      // Загружаем SVG в Image
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, options.width, options.height);
        URL.revokeObjectURL(url); // Освобождаем URL
      };
      img.onerror = () => {
        console.error('Failed to load SVG image');
        ctx.fillStyle = 'red';
        ctx.fillText('Error loading SVG', 10, 20);
        URL.revokeObjectURL(url); // Освобождаем URL даже при ошибке
      };
      img.src = url;
    } catch (e) {
      console.error('MathJax rendering error:', e);
      ctx.fillStyle = 'red';
      ctx.fillText('Invalid math expression', 10, 20);
    }

    return canvas;
  }
}
