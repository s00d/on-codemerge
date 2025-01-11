import {mathjax} from 'mathjax-full/js/mathjax';
import {TeX} from 'mathjax-full/js/input/tex';
import {SVG} from 'mathjax-full/js/output/svg';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html';
import type {MathExpression} from '../types';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({ packages: ['base', 'ams'] });
const svg = new SVG({ fontCache: 'local' });
const html = mathjax.document('', { InputJax: tex, OutputJax: svg });

export class MathRenderer {
  public async renderMath(
    expression: MathExpression,
    options: { width: number; height: number }
  ): Promise<HTMLImageElement> {
    const img = new Image();

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

      // Преобразование SVG в Data URL
      const encodedSvg = encodeURIComponent(svgString);
      // Установка Data URL в источник изображения
      img.className = 'svg-img'
      img.src = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
      img.width = options.width;
      img.height = options.height;
    } catch (e) {
      console.error('MathJax rendering error:', e);
      img.alt = 'Invalid math expression';
    }

    return img;
  }
}
