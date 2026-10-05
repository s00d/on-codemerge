import {
  PopupController,
  STUDIO_POPUP_CLASS,
  foreign,
  insertAtomAfter,
  pluginToolbarPlacement,
  readJsonAttr,
  nodeAtPath,
  pathFromEl,
} from '@codemerge/sdk';
import type { PluginContext, PluginToolbarOpts } from '@codemerge/sdk';

import { calendarIcon, deleteIcon, editIcon } from '@codemerge/sdk/icons';

import type { CalendarDoc } from '../types';
import { coerceCalendarDoc, emptyCalendarDoc } from '../drivers/defaults';
import { isCalendarDoc } from '../types';
import { mountCalendarWorkspace } from '../surface/workspaceView';

export type AtomChromeHandle = {
  openStudio: (existing?: HTMLElement | null) => void;
};

function payloadFromPath(editor: PluginContext['editor'], path: number[] | null): CalendarDoc {
  try {
    const node = nodeAtPath(editor.getState().doc, path);
    if (node?.type === 'calendar') {
      const payload = readJsonAttr(node.attrs?.payload, null);
      if (isCalendarDoc(payload)) {
        return payload;
      }
      return coerceCalendarDoc(payload);
    }
  } catch {
    /* ignore */
  }
  return emptyCalendarDoc();
}

export function setupAtomChrome(ctx: PluginContext, opts?: PluginToolbarOpts): AtomChromeHandle {
  const editor = ctx.editor;
  const popups = new PopupController((o) => editor.ui.popup.open(o), ctx.scope);

  const openStudio = (existing?: HTMLElement | null): void => {
    const atomPath = pathFromEl(existing ?? null);
    const initial = payloadFromPath(editor, atomPath);
    const isEdit = Boolean(atomPath);
    let saveFn: (() => void) | null = null;

    popups.open({
      title: editor.t(isEdit ? 'calendar.editCalendar' : 'calendar.title') || 'Calendar',
      className: STUDIO_POPUP_CLASS,
      size: 'lg',
      closeOnClickOutside: false,
      buttons: [
        {
          label: editor.t('common.cancel') || 'Cancel',
          variant: 'secondary',
          onClick: () => {},
        },
        {
          label: editor.t(isEdit ? 'common.save' : 'common.insert') || (isEdit ? 'Save' : 'Insert'),
          variant: 'primary',
          onClick: () => {
            saveFn?.();
          },
        },
      ],
      items: [
        {
          type: 'view',
          id: 'calendar-workspace',
          view: () =>
            foreign((host, scope) => {
              const handle = mountCalendarWorkspace(editor, host, {
                mode: 'atom',
                initial,
                scope: ctx.scope,
              });
              saveFn = () => {
                const payload = handle.getPayload();
                if (atomPath) {
                  editor.run(() => [
                    {
                      type: 'set_attrs',
                      path: atomPath,
                      attrs: { title: payload.title, payload },
                    },
                  ]);
                } else {
                  editor.run(
                    insertAtomAfter('calendar', {
                      title: payload.title,
                      payload,
                      align: '',
                    })
                  );
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
    id: 'calendar',
    icon: calendarIcon,
    title: () => editor.t('calendar.title') || 'Calendar',
    ...pluginToolbarPlacement({ menu: 'insert', order: 51 }, opts),
    onClick: () => {
      openStudio();
    },
  });

  const onCtx = (e: MouseEvent): void => {
    const target = e.target;
    if (!(target instanceof Element)) {
      return;
    }
    const atom = target.closest(
      '.ocm-calendar-atom, [data-ocm-type="calendar"], [data-type="calendar"][data-ocm-atom="1"]'
    );
    if (!(atom instanceof HTMLElement)) {
      return;
    }
    e.preventDefault();
    editor.ui.menu.open(
      [
        {
          label: editor.t('calendar.editCalendar') || 'Edit',
          icon: editIcon,
          onClick: () => {
            openStudio(atom);
          },
        },
        {
          label: editor.t('common.delete') || 'Delete',
          icon: deleteIcon,
          onClick: () => {
            const path = pathFromEl(atom);
            if (path && path[0] !== undefined) {
              editor.run(() => [{ type: 'remove_node', path: [], index: path[0] }]);
            }
          },
        },
      ],
      e.clientX,
      e.clientY
    );
  };
  ctx.onDom('host', 'contextmenu', onCtx);

  ctx.own({
    destroy: () => {
      popups.close();
    },
  });

  return { openStudio };
}
