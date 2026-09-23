import type { EditorAPI, DisposableScope } from '@on-codemerge/sdk';
import { attrString, h, renderDetached } from '@on-codemerge/sdk';
import type { MathMenu } from '../components/MathMenu';
import { MathContextMenu } from '../components/MathContextMenu';
import { Resizer } from '../../../utils/Resizer';
import { pathFromEl } from '../../../utils/atomPath';
import { MathRenderer } from '../services/MathRenderer';
import { atomAlignStyle } from '../../../utils/atomAlign';

function sizeStyle(width: number, height: number): Record<string, string> {
  if (width > 0 && height > 0) {
    return { width: `${width}px`, height: `${height}px` };
  }
  return { width: 'fit-content', maxWidth: '100%', height: 'auto' };
}

/** Mount math atom; teardown via `scope`. */
export function mountMathWidget(
  el: HTMLElement,
  attrs: Record<string, unknown>,
  getApi: () => EditorAPI | null,
  menu: MathMenu,
  scope: DisposableScope
): void {
  el.className = 'math-wrapper my-4 ocm-math-atom not-prose block w-full';
  el.replaceChildren();
  scope.disposable(() => {
    el.replaceChildren();
  });

  const expression = attrString(attrs.expression, '');
  const width = Number(attrs.width) || 0;
  const height = Number(attrs.height) || 0;
  const align = attrString(attrs.align, '');
  const built = renderDetached(
    h('div', {
      class: 'math-container',
      style: {
        ...sizeStyle(width, height),
        // Same mechanism as ImagePlugin — margin auto on the sized box.
        ...atomAlignStyle(align || 'center'),
      },
      attrs: { 'data-math-expression': expression },
    })
  );
  const container = built.el;
  scope.disposable(() => {
    built.destroy();
  });
  el.append(container);

  const renderer = new MathRenderer();
  const renderOpts =
    width > 0 && height > 0 ? { width, height } : ({} as { width?: number; height?: number });
  container.append(renderer.renderMath(expression, renderOpts));

  const resizer = scope.slot<Resizer>();
  const api = getApi();
  const ctxMenu = api ? scope.own(new MathContextMenu(api, menu)) : null;

  scope.on(el, 'click', () => {
    // Pin explicit size before resize so free handles have a starting box.
    if (!container.style.width.endsWith('px') || !container.style.height.endsWith('px')) {
      const rect = container.getBoundingClientRect();
      container.style.width = `${Math.ceil(rect.width)}px`;
      container.style.height = `${Math.ceil(rect.height)}px`;
      container.style.maxWidth = '';
    }
    resizer.replace(
      new Resizer(container, {
        aspect: 'free',
        onBlur: () => {
          resizer.clear();
        },
        onResize: (w, nextHeight) => {
          const expr = container.dataset.mathExpression ?? expression;
          menu.redrawMath(container, expr, { width: w, height: nextHeight });
        },
        onResizeEnd: () => {
          const ed = getApi();
          const path = pathFromEl(el);
          if (!ed || !path) {
            return;
          }
          ed.run(() => [
            {
              type: 'set_attrs',
              path,
              attrs: { width: container.offsetWidth, height: container.offsetHeight },
            },
          ]);
        },
      })
    );
  });

  scope.on(el, 'contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    ctxMenu?.show(el, container, e.clientX, e.clientY);
  });
}
