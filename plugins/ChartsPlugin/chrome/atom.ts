import {
  PopupController,
  STUDIO_POPUP_CLASS,
  foreign,
  insertAtomAfter,
  pluginToolbarPlacement,
} from '@codemerge/sdk';
import type { PluginContext, PluginToolbarOpts } from '@codemerge/sdk';
import { barIcon } from '@ocm/wysiwyg/icons';
import { nodeAtPath, pathFromEl } from '@ocm/wysiwyg/utils/atomPath';
import type { ChartAttrs } from '../io/adapters';
import { emptyChartAttrs, normalizeChartAttrs } from '../io/adapters';
import { mountChartWorkspace } from '../surface/workspaceView';

export type AtomChromeHandle = {
  openStudio: (existing?: HTMLElement | null) => void;
};

function attrsFromPath(editor: PluginContext['editor'], path: number[] | null): ChartAttrs {
  try {
    const node = nodeAtPath(editor.getState().doc, path);
    if (node?.type === 'chart') {
      return normalizeChartAttrs(node.attrs ?? {});
    }
  } catch {
    /* ignore */
  }
  return emptyChartAttrs();
}

export function setupAtomChrome(ctx: PluginContext, opts?: PluginToolbarOpts): AtomChromeHandle {
  const editor = ctx.editor;
  const popups = new PopupController((o) => editor.ui.popup.open(o), ctx.scope);

  const openStudio = (existing?: HTMLElement | null): void => {
    const atomPath = pathFromEl(existing ?? null);
    const initial = attrsFromPath(editor, atomPath);
    const isEdit = Boolean(atomPath);
    let saveFn: (() => void) | null = null;

    popups.open({
      title: editor.t(isEdit ? 'charts.editChart' : 'charts.insert'),
      className: `${STUDIO_POPUP_CLASS} chart-menu`,
      size: 'lg',
      closeOnClickOutside: false,
      buttons: [
        {
          label: editor.t('common.cancel'),
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: editor.t(isEdit ? 'common.save' : 'common.insert'),
          variant: 'primary',
          onClick: () => {
            saveFn?.();
          },
        },
      ],
      items: [
        {
          type: 'view',
          id: 'chart-workspace',
          view: () =>
            foreign((host, scope) => {
              const handle = mountChartWorkspace(editor, host, {
                mode: 'atom',
                initial,
                scope: ctx.scope,
              });
              saveFn = () => {
                const attrs = handle.getAttrs();
                if (atomPath) {
                  editor.run(() => [{ type: 'set_attrs', path: atomPath, attrs: { ...attrs } }]);
                } else {
                  editor.run(insertAtomAfter('chart', { ...attrs }));
                }
                popups.close();
              };
              scope.disposable(() => {
                handle.destroy();
                saveFn = null;
              });
            }),
        },
      ],
    });
  };

  ctx.toolbar.add({
    id: 'chart',
    icon: barIcon,
    title: () => editor.t('charts.insert'),
    ...pluginToolbarPlacement({ menu: 'insert', order: 50 }, opts),
    onClick: () => {
      openStudio();
    },
  });

  ctx.own({
    destroy: () => {
      popups.close();
    },
  });

  return { openStudio };
}
