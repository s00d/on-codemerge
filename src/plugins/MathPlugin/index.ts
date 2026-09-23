import './style.scss';

import { definePlugin, insertAtomAfter, foreign } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec } from '@on-codemerge/sdk';
import { MathMenu } from './components/MathMenu';
import { mountMathWidget } from './widgets/mountMathWidget';
import { mathIcon } from '../../icons';

export function MathPlugin() {
  let menu!: MathMenu;
  let openMath: (() => void) | null = null;

  return definePlugin({
    name: 'math',
    commands: {
      insertMath: () => {
        openMath?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Shift-m', command: 'insertMath', description: 'Insert math formula' }],
    nodes: [
      {
        name: 'math',
        group: 'atom',
        atom: true,
        attrs: { expression: '', align: '', width: 0, height: 0 },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      menu = new MathMenu(editor, ctx.scope);
      openMath = () => {
        menu.show((mathElement) => {
          const expression = mathElement.dataset.mathExpression ?? '';
          editor.run(
            insertAtomAfter('math', {
              expression,
              align: '',
              width: 0,
              height: 0,
            })
          );
        });
      };

      ctx.toolbar.add({
        id: 'math',
        icon: mathIcon,
        title: () => editor.t('math.insert'),
        menu: 'insert',
        order: 45,
        onClick: () => openMath?.(),
      });
    },
    widgets: {
      math: {
        render(attrs, wctx: WidgetContext): ViewSpec {
          return foreign((host, scope) => {
            mountMathWidget(host, attrs, () => wctx.editor, menu, scope);
          });
        },
      },
    },
  });
}
