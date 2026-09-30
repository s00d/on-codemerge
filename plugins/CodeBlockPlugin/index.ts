import './style.scss';
import type { Command } from '@codemerge/kernel';
import {
  applyToolbarConfig,
  definePlugin,
  insertAtomAfter,
  attrString,
  foreign,
  pluginToolbarPlacement,
} from '@codemerge/sdk';
import type { PluginDefinition, WidgetContext, ViewSpec, PluginToolbarOpts } from '@codemerge/sdk';
import { highlightHtml } from '@codemerge/editor';
import { HistoryChromePlugin } from '../HistoryPlugin';
import { CodeBlockModal } from './components/CodeBlockModal';
import { CodeBlockContextMenu } from './components/CodeBlockContextMenu';
import { renderCodeBlockDom } from './widgets/renderCodeBlockDom';
import { replaceChildrenWithHtml } from '@ocm/wysiwyg/utils/domHtml';
import { insertIcon } from '@ocm/wysiwyg/icons';
import { isCodeEditorDoc } from './io';
import { mountCodeWorkspace } from './surface/workspaceView';
import type { CodeWorkspaceHandle } from './surface/workspaceView';
import { defaultCodeToolbar } from './chrome/defaultToolbar';
import type { CodeToolbarOptions } from './chrome/types';

export {
  emptyEditorDoc,
  isCodeEditorDoc,
  parseText,
  serializeText,
  serializeDoc,
  textFromDoc,
  languageFromDoc,
  safeLangToken,
  ParseError,
  MAX_CODE_BYTES,
  type ParseTextResult,
} from './io';
export { defaultCodeToolbar } from './chrome/defaultToolbar';
export type {
  CodeToolbarActionApi,
  CodeToolbarItem,
  CodeToolbarMenu,
  CodeToolbarOptions,
} from './chrome/types';
export { HistoryChromePlugin } from '../HistoryPlugin';
export type { CodeBlockAttrs, CodeSourceAttrs } from './types';

const CODE_SOURCE_NODE = {
  name: 'code_source',
  group: 'block' as const,
  attrs: { text: '', language: 'plaintext' },
};

const CODE_BLOCK_ATOM = {
  name: 'code_block',
  group: 'atom' as const,
  atom: true as const,
  attrs: { language: '', code: '' },
};

export type CodeBlockPluginFeatures = {
  /** Atom Insert toolbar button (default true on atom). */
  toolbar?: boolean;
  /** Include HistoryChromePlugin in createDefaultPlugins (default true for workspace). */
  historyChrome?: boolean;
};

export type CodeBlockPluginOptions = PluginToolbarOpts & {
  /**
   * `workspace` — mount source editor into shell contentTarget (slim Code app).
   * `atom` — Insert code_block embed (WYSIWYG; default).
   */
  surface?: 'workspace' | 'atom';
  features?: CodeBlockPluginFeatures;
  /** Declarative workspace toolbar. Atom surface ignores this. */
  toolbar?: CodeToolbarOptions;
};

/**
 * Code block plugin — atom insert (WYSIWYG) or workspace Code Editor surface.
 */
export function CodeBlockPlugin(options: CodeBlockPluginOptions = {}): PluginDefinition {
  const surface = options.surface ?? 'atom';
  const workspace = surface === 'workspace';
  const feat = (key: keyof CodeBlockPluginFeatures, defaultOn: boolean): boolean => {
    const v = options.features?.[key];
    return v === undefined ? defaultOn : v;
  };
  const features: Required<CodeBlockPluginFeatures> = {
    toolbar: feat('toolbar', true),
    historyChrome: feat('historyChrome', workspace),
  };

  let openModal:
    | ((code?: string, language?: string, onSave?: (c: string, l: string) => void) => void)
    | null = null;
  const workspaceRef: { current: CodeWorkspaceHandle | null } = { current: null };

  const commands: Record<string, Command> = {
    insertCodeBlock: () => {
      openModal?.('', '');
      return null;
    },
  };

  return definePlugin({
    name: 'code-block',
    nodes: workspace ? [CODE_SOURCE_NODE] : [CODE_BLOCK_ATOM],
    commands: workspace ? {} : commands,
    hotkeys: workspace
      ? []
      : [{ keys: 'Mod-Alt-q', command: 'insertCodeBlock', description: 'Insert code block' }],
    setup(ctx) {
      if (workspace) {
        const doc = ctx.editor.getState().doc;
        if (!isCodeEditorDoc(doc)) {
          throw new TypeError(
            'CodeBlockPlugin({ surface: "workspace" }) requires code SoT (doc→code_source); seed emptyEditorDoc()'
          );
        }
        const fromApi = ctx.editor.contentElement();
        const contentEl =
          fromApi instanceof HTMLElement && fromApi.getAttribute('data-ocm-shell') === 'true'
            ? fromApi
            : ctx.editor.host.querySelector('[data-ocm-shell="true"]');
        if (!(contentEl instanceof HTMLElement)) {
          throw new TypeError(
            'CodeBlockPlugin({ surface: "workspace" }) requires createShellView contentTarget (data-ocm-shell)'
          );
        }
        const surfaceHandle = mountCodeWorkspace(ctx.editor, contentEl);
        workspaceRef.current = surfaceHandle;
        ctx.own({
          destroy: () => {
            workspaceRef.current = null;
            surfaceHandle.destroy();
          },
        });
        ctx.on('docChanged', () => {
          surfaceHandle.update(ctx.editor.getState());
        });
        const toolbarConfig = options.toolbar ?? defaultCodeToolbar();
        applyToolbarConfig(ctx, toolbarConfig, () => ({
          editor: ctx.editor,
          workspace: workspaceRef.current,
        }));
        return;
      }

      const editor = ctx.editor;
      const modal = new CodeBlockModal(editor, ctx.scope);
      openModal = (code = '', language = '', onSave?) => {
        modal.show(
          (newCode, newLanguage) => {
            if (onSave) {
              onSave(newCode, newLanguage);
              return;
            }
            editor.run(insertAtomAfter('code_block', { code: newCode, language: newLanguage }));
          },
          code,
          language
        );
      };
      const contextMenu = ctx.own(
        new CodeBlockContextMenu(editor, (block) => {
          const codeElement = block.querySelector('code');
          const languageElement = block.querySelector('.code-language');
          if (!codeElement || !languageElement) {
            return;
          }
          const code = codeElement.textContent || '';
          const language = languageElement.textContent || '';
          openModal?.(code, language, (newCode, newLanguage) => {
            const pathRaw =
              block.dataset.ocmPath ??
              block.dataset.ocmBlock ??
              block.closest<HTMLElement>('[data-ocm-path]')?.dataset.ocmPath ??
              block.closest<HTMLElement>('[data-ocm-block]')?.dataset.ocmBlock;
            if (pathRaw !== undefined && pathRaw !== null) {
              const path = pathRaw.includes('.')
                ? pathRaw.split('.').map(Number)
                : [Number(pathRaw)];
              editor.run(() => [
                {
                  type: 'set_attrs',
                  path,
                  attrs: { code: newCode, language: newLanguage },
                },
              ]);
            }
          });
        })
      );

      if (features.toolbar) {
        ctx.toolbar.add({
          id: 'code-block',
          icon: insertIcon,
          title: () => editor.t('codeBlock.insert'),
          ...pluginToolbarPlacement({ menu: 'insert', order: 45 }, options),
          onClick: () => openModal?.(),
        });
      }

      ctx.onDom('host', 'contextmenu', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const codeBlock = target.closest(
          '.code-block, [data-type="codeBlock"], [data-ocm-type="codeBlock"]'
        );
        if (!(codeBlock instanceof HTMLElement)) {
          return;
        }
        e.preventDefault();
        contextMenu.show(codeBlock, e.clientX, e.clientY);
      });
    },
    widgets: workspace
      ? undefined
      : {
          code_block: {
            render(attrs, wctx: WidgetContext): ViewSpec {
              const t = (k: string) => wctx.editor.t(k) || k;
              return foreign((host, scope) => {
                host.className = 'ocm-atom';
                const code = attrString(attrs.code);
                const language = attrString(attrs.language);
                const openEdit = () => {
                  openModal?.(code, language, (newCode, newLanguage) => {
                    wctx.updateAttrs({ code: newCode, language: newLanguage });
                  });
                };
                const block = renderCodeBlockDom(code, language, t, openEdit);
                host.append(block);
                const codeElement = block.querySelector('code');
                if (codeElement) {
                  replaceChildrenWithHtml(codeElement, highlightHtml(code));
                }
                scope.disposable(() => {
                  host.replaceChildren();
                });
              });
            },
          },
        },
  });
}

/** Default slim Code app plugin set: HistoryChrome + workspace CodeBlockPlugin. */
export function createDefaultPlugins(
  opts: {
    toolbar?: CodeToolbarOptions;
    features?: CodeBlockPluginFeatures;
  } = {}
): PluginDefinition[] {
  const features: Required<CodeBlockPluginFeatures> = {
    toolbar: true,
    historyChrome: true,
    ...opts.features,
  };
  return [
    ...(features.historyChrome ? [HistoryChromePlugin()] : []),
    CodeBlockPlugin({
      surface: 'workspace',
      toolbar: opts.toolbar ?? defaultCodeToolbar(),
      features,
    }),
  ];
}
