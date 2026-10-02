import './style.scss';
import { wirePluginLocales } from '@codemerge/editor';
import pluginLocaleEn from './i18n/locales/en.json';

import type { Command } from '@codemerge/kernel';
import { applyToolbarConfig, definePlugin, foreign, h } from '@codemerge/sdk';
import type { PluginDefinition, PluginToolbarOpts, ViewSpec, WidgetContext } from '@codemerge/sdk';
import { readJsonAttr } from '@ocm/wysiwyg/utils/attrJson';
import { HistoryChromePlugin } from '../HistoryPlugin';
import { setupAtomChrome } from './chrome/atom';
import type { AtomChromeHandle } from './chrome/atom';
import { defaultFormToolbar } from './chrome/defaultToolbar';
import type { FormToolbarOptions } from './chrome/types';
import { isFormEditorDoc } from './io';
import { mountFormWorkspace } from './surface/workspaceView';
import type { FormWorkspaceHandle } from './surface/workspaceView';
import { mountFormWidget } from './widgets/mountFormWidget';
import { formView } from './render/formView';
import { isFormConfig } from './types';

const pluginLocaleModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './i18n/locales/*.json',
  '!./i18n/locales/en.json',
]);

export {
  emptyFormConfig,
  emptyEditorDoc,
  isFormEditorDoc,
  resolveFormNode,
  configFromDoc,
  docFromConfig,
  toEditorDoc,
  ParseError,
  parseText,
  serializeText,
  serializeDoc,
  serializeConfig,
  MAX_FORM_BYTES,
  type ParseTextResult,
} from './io';
export { defaultFormToolbar } from './chrome/defaultToolbar';
export type {
  FormToolbarActionApi,
  FormToolbarItem,
  FormToolbarMenu,
  FormToolbarOptions,
} from './chrome/types';
export { HistoryChromePlugin } from '../HistoryPlugin';
export type { FormConfig, FieldConfig, FieldType, FormTemplate } from './types';
export { isFormConfig, isFieldType } from './types';
export { fieldView } from './render/fieldView';
export { formView } from './render/formView';
export {
  DRIVERS,
  getDriver,
  paletteFieldTypes,
  createField,
  validateFieldForDriver,
} from './drivers';
export type { FieldDriver, FieldFamily, FormI18n } from './drivers';
export { FormStore } from './services/FormStore';
export { mountFormWorkspace } from './surface/workspaceView';
export type { FormWorkspaceHandle } from './surface/workspaceView';

export type FormBuilderPluginFeatures = {
  toolbar?: boolean;
  historyChrome?: boolean;
};

export type FormBuilderPluginOptions = PluginToolbarOpts & {
  surface?: 'workspace' | 'atom';
  features?: FormBuilderPluginFeatures;
  toolbar?: FormToolbarOptions;
};

export function FormBuilderPlugin(options: FormBuilderPluginOptions = {}): PluginDefinition {
  const surface = options.surface ?? 'atom';
  const workspace = surface === 'workspace';
  const feat = (key: keyof FormBuilderPluginFeatures, defaultOn: boolean): boolean => {
    const v = options.features?.[key];
    return v === undefined ? defaultOn : v;
  };
  const features: Required<FormBuilderPluginFeatures> = {
    toolbar: feat('toolbar', true),
    historyChrome: feat('historyChrome', workspace),
  };
  const toolbarConfig: FormToolbarOptions | undefined = workspace
    ? (options.toolbar ?? defaultFormToolbar())
    : undefined;

  const atomChrome: { current: AtomChromeHandle | null } = { current: null };
  const workspaceRef: { current: FormWorkspaceHandle | null } = { current: null };

  const commands: Record<string, Command> = {
    insertForm: () => {
      atomChrome.current?.openBuilder();
      return null;
    },
    'form.openTemplates': () => {
      workspaceRef.current?.openTemplates();
      return null;
    },
    'form.clearFields': () => {
      workspaceRef.current?.clearFields();
      return null;
    },
  };

  const hotkeys = !workspace
    ? [{ keys: 'Mod-Alt-f', command: 'insertForm', description: 'Insert form' }]
    : [];

  return definePlugin({
    name: 'form-builder',
    nodes: [
      {
        name: 'form',
        group: 'atom',
        atom: true,
        attrs: { schema: {}, action: '', align: '' },
      },
    ],
    commands,
    hotkeys,
    setup(ctx) {
      ctx.disposable(
        wirePluginLocales(ctx.editor, pluginLocaleEn, pluginLocaleModules, './i18n/locales')
      );
      if (workspace) {
        const doc = ctx.editor.getState().doc;
        if (!isFormEditorDoc(doc)) {
          throw new TypeError(
            'FormBuilderPlugin({ surface: "workspace" }) requires form SoT (doc→form); seed emptyEditorDoc()'
          );
        }
        const fromApi = ctx.editor.contentElement();
        const contentEl =
          fromApi instanceof HTMLElement && fromApi.getAttribute('data-ocm-shell') === 'true'
            ? fromApi
            : ctx.editor.host.querySelector('[data-ocm-shell="true"]');
        if (!(contentEl instanceof HTMLElement)) {
          throw new TypeError(
            'FormBuilderPlugin({ surface: "workspace" }) requires createShellView contentTarget (data-ocm-shell)'
          );
        }

        let writing = false;
        const handle = mountFormWorkspace(ctx.editor, contentEl, {
          mode: 'workspace',
          scope: ctx.scope,
          onChange: (formConfig) => {
            if (writing) {
              return;
            }
            writing = true;
            ctx.editor.run(() => [
              {
                type: 'set_attrs',
                path: [0],
                attrs: {
                  schema: formConfig,
                  action: formConfig.action || '',
                },
              },
            ]);
            writing = false;
            ctx.editor.toolbar.refresh();
          },
        });
        workspaceRef.current = handle;
        ctx.own({
          destroy: () => {
            workspaceRef.current = null;
            handle.destroy();
          },
        });
        ctx.on('docChanged', () => {
          if (!writing) {
            handle.update(ctx.editor.getState());
          }
        });
        if (toolbarConfig) {
          applyToolbarConfig(ctx, toolbarConfig, () => ({
            editor: ctx.editor,
            workspace: workspaceRef.current,
          }));
        }
      } else if (features.toolbar) {
        const { menu, group, order } = options;
        atomChrome.current = setupAtomChrome(ctx, {
          ...(menu !== undefined ? { menu } : {}),
          ...(group !== undefined ? { group } : {}),
          ...(order !== undefined ? { order } : {}),
        });
      }
    },
    widgets: workspace
      ? undefined
      : {
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
          formView(schema, { i18n: { t: (key: string) => key } })
        );
      },
    },
  });
}

export function createDefaultPlugins(
  opts: {
    toolbar?: FormToolbarOptions;
    features?: FormBuilderPluginFeatures;
  } = {}
): PluginDefinition[] {
  const features: Required<FormBuilderPluginFeatures> = {
    toolbar: true,
    historyChrome: true,
    ...opts.features,
  };
  return [
    ...(features.historyChrome ? [HistoryChromePlugin()] : []),
    FormBuilderPlugin({
      surface: 'workspace',
      toolbar: opts.toolbar ?? defaultFormToolbar(),
      features,
    }),
  ];
}

export default FormBuilderPlugin;
