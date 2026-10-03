import {
  PopupController,
  STUDIO_POPUP_CLASS,
  foreign,
  insertAtomAfter,
  pluginToolbarPlacement,
} from '@codemerge/sdk';
import type { PluginContext, PluginToolbarOpts } from '@codemerge/sdk';
import { deleteIcon, duplicateIcon, editIcon, formIcon } from '@ocm/wysiwyg/icons';
import { readJsonAttr } from '@ocm/wysiwyg/utils/attrJson';
import { nodeAtPath, pathFromEl } from '@ocm/wysiwyg/utils/atomPath';
import type { FormConfig } from '../types';
import { isFormConfig } from '../types';
import { emptyFormConfig } from '../io/adapters';
import { mountFormWorkspace } from '../surface/workspaceView';

export type AtomChromeHandle = {
  openBuilder: (existing?: HTMLElement | null) => void;
};

function schemaFromPath(editor: PluginContext['editor'], path: number[] | null): FormConfig {
  try {
    const node = nodeAtPath(editor.getState().doc, path);
    if (node?.type === 'form') {
      const schema = readJsonAttr(node.attrs?.schema, null);
      if (isFormConfig(schema)) {
        return schema;
      }
    }
  } catch {
    /* ignore */
  }
  return emptyFormConfig();
}

export function setupAtomChrome(ctx: PluginContext, opts?: PluginToolbarOpts): AtomChromeHandle {
  const editor = ctx.editor;
  const popups = new PopupController((o) => editor.ui.popup.open(o), ctx.scope);
  let workspaceDestroy: (() => void) | null = null;

  const openBuilder = (existing?: HTMLElement | null): void => {
    const atomPath = pathFromEl(existing ?? null);
    const initial = schemaFromPath(editor, atomPath);
    const isEdit = Boolean(atomPath);

    popups.open({
      title: editor.t(isEdit ? 'formBuilder.editForm' : 'formBuilder.title'),
      className: STUDIO_POPUP_CLASS,
      size: 'lg',
      closeOnClickOutside: false,
      items: [
        {
          type: 'view',
          id: 'form-workspace',
          view: () =>
            foreign((host, scope) => {
              const handle = mountFormWorkspace(editor, host, {
                mode: 'atom',
                initial,
                scope: ctx.scope,
                onSave: (formConfig) => {
                  if (atomPath) {
                    editor.run(() => [
                      {
                        type: 'set_attrs',
                        path: atomPath,
                        attrs: {
                          schema: formConfig,
                          action: formConfig.action || '',
                        },
                      },
                    ]);
                  } else {
                    editor.run(
                      insertAtomAfter('form', {
                        schema: formConfig,
                        action: formConfig.action || '',
                        align: '',
                      })
                    );
                  }
                  popups.close();
                },
                onCancel: () => {
                  popups.close();
                },
              });
              workspaceDestroy = () => {
                handle.destroy();
              };
              scope.disposable(() => {
                handle.destroy();
                workspaceDestroy = null;
              });
            }),
        },
      ],
    });
  };

  ctx.toolbar.add({
    id: 'form',
    icon: formIcon,
    title: () => editor.t('formBuilder.insertForm'),
    ...pluginToolbarPlacement({ menu: 'insert', order: 53 }, opts),
    onClick: () => {
      openBuilder();
    },
  });

  const onCtx = (e: MouseEvent) => {
    const target = e.target;
    if (!(target instanceof Element)) {
      return;
    }
    const form = target.closest(
      'form, .ocm-form-atom, .ocm-form, [data-ocm-type="form"], [data-type="form"][data-ocm-atom="1"]'
    );
    if (!(form instanceof HTMLElement)) {
      return;
    }
    e.preventDefault();
    editor.ui.menu.open(
      [
        {
          label: editor.t('formBuilder.editForm'),
          icon: editIcon,
          onClick: () => {
            openBuilder(form);
          },
        },
        {
          label: editor.t('formBuilder.duplicateForm'),
          icon: duplicateIcon,
          onClick: () => {
            const path = pathFromEl(form);
            if (!path) {
              return;
            }
            try {
              const node = editor.getJSON().doc.content?.[path[0]];
              if (node?.type === 'form') {
                editor.run(insertAtomAfter('form', { ...node.attrs }));
              }
            } catch {
              /* ignore */
            }
          },
        },
        { type: 'divider' },
        {
          label: editor.t('common.delete'),
          icon: deleteIcon,
          variant: 'danger',
          onClick: () => {
            const path = pathFromEl(form);
            if (!path) {
              return;
            }
            editor.run(() => [{ type: 'remove_node', path: [], index: path[0] }]);
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
      workspaceDestroy?.();
      popups.close();
    },
  });

  return { openBuilder };
}
