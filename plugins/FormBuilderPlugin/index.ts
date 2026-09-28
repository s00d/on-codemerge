import './style.scss';
import {
  definePlugin,
  foreign,
  h,
  insertAtomAfter,
  pluginToolbarPlacement,
} from '@on-codemerge/sdk';
import type { PluginToolbarOpts, ViewSpec, WidgetContext } from '@on-codemerge/sdk';
import { readJsonAttr } from '@ocm/wysiwyg/utils/attrJson';
import { deleteIcon, duplicateIcon, editIcon, formIcon } from '@ocm/wysiwyg/icons';
import { TemplateManager } from './services/TemplateManager';
import { FormBuilderModal } from './components/FormBuilderModal';
import { FormManager } from './services/FormManager';
import { mountFormWidget } from './widgets/mountFormWidget';
import type { FormConfig } from './types';
import { isFormConfig } from './types';

export function FormBuilderPlugin(opts?: PluginToolbarOpts) {
  let openFormBuilder: ((existing?: HTMLElement | null) => void) | null = null;

  return definePlugin({
    commands: {
      insertForm: () => {
        openFormBuilder?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-f', command: 'insertForm', description: 'Insert form' }],
    name: 'form-builder',
    nodes: [
      {
        name: 'form',
        group: 'atom',
        atom: true,
        attrs: { schema: {}, action: '', align: '' },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const templateManager = new TemplateManager(editor);
      templateManager.initialize();

      openFormBuilder = (existing?: HTMLElement | null) => {
        const modal = new FormBuilderModal(editor, ctx.scope);
        const pathEl = existing?.closest('[data-ocm-path], [data-ocm-block]') ?? existing ?? null;
        const pathRaw =
          pathEl instanceof HTMLElement
            ? (pathEl.dataset.ocmPath ?? pathEl.dataset.ocmBlock ?? '')
            : '';
        const atomPath = pathRaw.includes('.')
          ? pathRaw.split('.').map(Number)
          : pathRaw === ''
            ? null
            : [Number(pathRaw)];

        modal.show(
          (formConfig: FormConfig) => {
            if (atomPath && atomPath.every((n) => Number.isFinite(n))) {
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
              return;
            }
            editor.run(
              insertAtomAfter('form', {
                schema: formConfig,
                action: formConfig.action || '',
                align: '',
              })
            );
          },
          Boolean(existing),
          existing ?? null
        );
      };

      ctx.toolbar.add({
        id: 'form',
        icon: formIcon,
        title: () => editor.t('formBuilder.insertForm'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 53 }, opts),
        onClick: () => openFormBuilder?.(),
      });

      const onCtx = (e: MouseEvent) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const form = target.closest('form, .ocm-form-atom, .ocm-form, [data-ocm-type="form"]');
        if (!(form instanceof HTMLElement)) {
          return;
        }
        e.preventDefault();
        editor.ui.menu.open(
          [
            {
              label: editor.t('formBuilder.editForm'),
              icon: editIcon,
              onClick: () => openFormBuilder?.(form),
            },
            {
              label: editor.t('formBuilder.duplicateForm'),
              icon: duplicateIcon,
              onClick: () => {
                const pathRaw =
                  form.dataset.ocmPath ??
                  form.dataset.ocmBlock ??
                  form.closest<HTMLElement>('[data-ocm-path], [data-ocm-block]')?.dataset.ocmPath ??
                  form.closest<HTMLElement>('[data-ocm-block]')?.dataset.ocmBlock;
                if (!pathRaw) {
                  return;
                }
                const path = pathRaw.includes('.')
                  ? pathRaw.split('.').map(Number)
                  : [Number(pathRaw)];
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
                const pathRaw =
                  form.dataset.ocmPath ??
                  form.dataset.ocmBlock ??
                  form.closest<HTMLElement>('[data-ocm-path]')?.dataset.ocmPath ??
                  form.closest<HTMLElement>('[data-ocm-block]')?.dataset.ocmBlock;
                if (pathRaw === undefined || pathRaw === null) {
                  return;
                }
                const index = Number(pathRaw.split('.')[0]);
                editor.run(() => [{ type: 'remove_node', path: [], index }]);
              },
            },
          ],
          e.clientX,
          e.clientY
        );
      };
      ctx.onDom('host', 'contextmenu', onCtx);
    },
    widgets: {
      form: {
        render(attrs, wctx: WidgetContext): ViewSpec {
          return foreign((host, scope) => {
            mountFormWidget(host, attrs, () => wctx.editor, scope);
          });
        },
      },
    },
    publish: {
      node: 'form',
      render: (attrs) => {
        const schema = readJsonAttr(attrs.schema, null);
        if (!isFormConfig(schema)) {
          return h('div', { attrs: { 'data-node': 'form' } }, 'Form');
        }
        return h(
          'div',
          { class: 'ocm-form-publish', attrs: { 'data-node': 'form' } },
          new FormManager({ t: (key: string) => key }).createForm(schema)
        );
      },
    },
  });
}

export default FormBuilderPlugin;
