import { h, renderDetached } from '@on-codemerge/sdk';
import { parseMath } from '../utils/parse';
import { astToMathML, escapeText } from '../utils/mathml';

export type MathRenderOptions = {
  width?: number;
  height?: number;
  display?: 'block' | 'inline';
};

const BASE_FONT_PX = 20;

/**
 * TeX-subset → MathML (browser layout). No KaTeX.
 */
export class MathRenderer {
  renderMath(expression: string, options: MathRenderOptions = {}): HTMLElement {
    const display = options.display ?? 'block';
    const parsed = parseMath(expression);

    if (!parsed.ok) {
      const { el } = renderDetached(
        h(
          'div',
          {
            class:
              'ocm-math-content ocm-math-error font-mono text-sm text-red-600 whitespace-pre-wrap p-2',
            attrs: { role: 'alert', title: parsed.error },
          },
          escapeText(expression || parsed.error)
        )
      );
      return el;
    }

    const math = astToMathML(parsed.ast, display);
    const { el: wrap } = renderDetached(
      h('div', {
        class: 'ocm-math-content flex items-center justify-center',
      })
    );

    const w = options.width ?? 0;
    const hPx = options.height ?? 0;
    if (w > 0 && hPx > 0) {
      // Explicit box (user-resized): scale font from container size.
      const fs = Math.max(14, Math.min(48, Math.round(Math.min(w, hPx) / 4)));
      wrap.style.fontSize = `${fs}px`;
    } else {
      wrap.style.fontSize = `${BASE_FONT_PX}px`;
    }

    wrap.append(math);
    return wrap;
  }
}
