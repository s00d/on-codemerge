import { applyToolbarConfig, definePlugin, foreign, h, attrString } from '@codemerge/sdk';
import type { PluginDefinition, PluginToolbarOpts, WidgetContext } from '@codemerge/sdk';
import type { Command } from '@codemerge/kernel';

import { setupAtomChrome } from './chrome/atom';
import type { AtomChromeHandle } from './chrome/atom';
import { defaultMdToolbar } from './chrome/defaultToolbar';
import type { MdToolbarActionApi, MdToolbarOptions } from './chrome/types';
import {
  insertMdBullet,
  insertMdCallout,
  insertMdCodeBlock,
  insertMdHeading,
  insertMdMermaid,
  insertMdQuote,
  setFirstCalloutVariant,
} from './commands/mdBlocks';
import { createMdElementRegistry } from './elements/registry';
import type { MdCustomElement } from './elements/types';
import type { MdElementRegistry } from './elements/types';
import { isMarkdownEditorDoc } from './io/adapters';
import { mountMdWorkspace } from './surface/workspaceView';
import type { MdRemotePreviewOptions, MdWorkspaceHandle } from './surface/workspaceView';
import { mountMdEmbed } from './widgets/mountMdEmbed';
import { renderMdEmbedPublish } from './publish/preview';

export { emptyEditorDoc, isMarkdownEditorDoc, docToText } from './io/adapters';
export { parseText, serializeText, serializeDoc } from './io/text';
export type { ParseTextResult } from './io/text';
export {
  renderMarkdownPreviewHtml,
  compactMarkdownText,
  expandCompactMarkdownText,
  prettyMarkdownText,
} from './io/preview';
export { projectPreviewHtml } from './io/projectPreview';
export { createMdElementRegistry, defaultMdElementRegistry } from './elements/registry';
export { BUILTIN_MD_ELEMENTS } from './elements/builtins';
export type {
  MdCustomElement,
  MdElementBlock,
  MdElementButton,
  MdElementRegistry,
} from './elements/types';
export { hydrateMermaidBlocks } from './widgets/mermaidHydrate';
export { defaultMdToolbar, runInsertMarkdown, runMdCommand } from './chrome/defaultToolbar';
export type {
  MdToolbarActionApi,
  MdToolbarItem,
  MdToolbarMenu,
  MdToolbarOptions,
} from './chrome/types';
export type { MdRemotePreviewOptions } from './surface/workspaceView';

/** Atom surface (WYSIWYG embed) — only md_embed; prose nodes come from Typography/Lists/…. */
const MD_ATOM_NODES = [
  {
    name: 'md_embed',
    group: 'atom' as const,
    atom: true as const,
    attrs: { text: '# Markdown\n\nHello **world**.\n' },
  },
];

/** Workspace surface — MD prose subset + embed atom unused in slim app. */
const MD_WORKSPACE_NODES = [
  { name: 'heading', group: 'block' as const, attrs: { level: 1 } },
  { name: 'blockquote', group: 'block' as const },
  { name: 'bulletList', group: 'block' as const },
  { name: 'orderedList', group: 'block' as const },
  { name: 'listItem', group: 'block' as const },
  { name: 'horizontalRule', group: 'block' as const },
  {
    name: 'code_block',
    group: 'atom' as const,
    atom: true as const,
    attrs: { language: 'plaintext', code: '' },
  },
  {
    name: 'callout',
    group: 'block' as const,
    attrs: { variant: 'info', title: '', actions: [] as { label: string; href: string }[] },
  },
  {
    name: 'mermaid',
    group: 'atom' as const,
    atom: true as const,
    attrs: { source: '' },
  },
  ...MD_ATOM_NODES,
];

export type MarkdownPluginFeatures = {
  /** Atom Insert-embed chrome (default true). Workspace ignores this for bar buttons. */
  toolbar?: boolean;
};

export type MarkdownPluginOptions = PluginToolbarOpts & {
  /**
   * `workspace` — dual-pane into `contentTarget` (slim markdown app).
   * `atom` — schema + Insert Markdown embed (WYSIWYG; default).
   */
  surface?: 'workspace' | 'atom';
  features?: MarkdownPluginFeatures;
  /**
   * Extra custom elements merged with builtins (info / warn / error).
   * Used by preview + by `defaultMdToolbar({ elements })` when building the preset.
   */
  elements?: MdCustomElement[];
  /**
   * Declarative workspace toolbar (menus + items). Sole source of bar buttons.
   * Omit to use `defaultMdToolbar` (same role as `createDefaultPlugins` for WYSIWYG).
   * Pass `{ menus: [], items: [] }` for an empty bar.
   * Atom surface ignores this; use `menu` / `group` / `order` for Insert placement.
   */
  toolbar?: MdToolbarOptions;
  /**
   * Workspace-only: POST markdown to a host renderer for the right-pane preview.
   * Omit → local `projectPreviewHtml`. Atom surface ignores this.
   */
  preview?: MdRemotePreviewOptions;
};

export function MarkdownPlugin(options: MarkdownPluginOptions = {}): PluginDefinition {
  const surface = options.surface ?? 'atom';
  const workspace = surface === 'workspace';
  const feat = (key: keyof MarkdownPluginFeatures, defaultOn: boolean): boolean => {
    const v = options.features?.[key];
    return v === undefined ? defaultOn : v;
  };
  const features: Required<MarkdownPluginFeatures> = {
    toolbar: feat('toolbar', true),
  };
  const elements: MdElementRegistry = createMdElementRegistry(options.elements ?? []);
  const toolbarConfig: MdToolbarOptions | undefined = workspace
    ? (options.toolbar ?? defaultMdToolbar({ elements }))
    : undefined;
  const atomChrome: { current: AtomChromeHandle | null } = { current: null };
  const workspaceRef: { current: MdWorkspaceHandle | null } = { current: null };

  const commands: Record<string, Command> = {
    insertMdEmbed: () => {
      atomChrome.current?.openInsert();
      return null;
    },
    ...(workspace
      ? {
          insertMdHeading1: insertMdHeading(1),
          insertMdHeading2: insertMdHeading(2),
          insertMdHeading3: insertMdHeading(3),
          insertMdQuote: insertMdQuote(),
          insertMdBullet: insertMdBullet(),
          insertMdCodeBlock: insertMdCodeBlock(),
          insertMdMermaid: insertMdMermaid(),
          insertMdCalloutInfo: insertMdCallout('info', 'Info'),
          insertMdCalloutWarn: insertMdCallout('warn', 'Warning'),
          insertMdCalloutError: insertMdCallout('error', 'Error'),
          turnCalloutInfo: setFirstCalloutVariant('info'),
          turnCalloutWarn: setFirstCalloutVariant('warn'),
          turnCalloutError: setFirstCalloutVariant('error'),
        }
      : {}),
  };

  const hotkeys =
    !workspace && features.toolbar
      ? [
          {
            keys: 'Mod-Alt-m',
            command: 'insertMdEmbed',
            description: 'Insert Markdown embed',
          },
        ]
      : [];

  return definePlugin({
    name: 'markdown',
    nodes: workspace ? MD_WORKSPACE_NODES : MD_ATOM_NODES,
    marks: workspace ? [{ name: 'link', attrs: { href: '' } }, { name: 'code' }] : [],
    commands,
    hotkeys,
    setup(ctx) {
      if (workspace) {
        const doc = ctx.editor.getState().doc;
        if (!isMarkdownEditorDoc(doc)) {
          throw new TypeError(
            'MarkdownPlugin({ surface: "workspace" }) requires a prose Markdown SoT; seed emptyEditorDoc()'
          );
        }
        const fromApi = ctx.editor.contentElement();
        const contentEl =
          fromApi instanceof HTMLElement && fromApi.getAttribute('data-ocm-shell') === 'true'
            ? fromApi
            : ctx.editor.host.querySelector('[data-ocm-shell="true"]');
        if (!(contentEl instanceof HTMLElement)) {
          throw new TypeError(
            'MarkdownPlugin({ surface: "workspace" }) requires createShellView contentTarget (data-ocm-shell)'
          );
        }
        let remotePreviewBusy = false;
        const surfaceHandle = mountMdWorkspace(ctx.editor, contentEl, {
          dirtyDraft: false,
          elements,
          preview: options.preview,
          onRemotePreviewBusy: options.preview?.url
            ? (busy) => {
                remotePreviewBusy = busy;
                ctx.editor.toolbar.refresh();
              }
            : undefined,
        });
        workspaceRef.current = surfaceHandle;
        if (options.preview?.url) {
          ctx.toolbar.add({
            id: 'md-remote-preview-busy',
            align: 'end',
            group: 'overlay',
            order: 90,
            title: () => ctx.editor.t('markdown.previewUpdating') || 'Updating preview…',
            view: () =>
              remotePreviewBusy
                ? h(
                    'span',
                    {
                      class: 'ocm-toolbar__busy',
                      attrs: {
                        role: 'status',
                        'aria-live': 'polite',
                        'aria-label':
                          ctx.editor.t('markdown.previewUpdating') || 'Updating preview…',
                        title: ctx.editor.t('markdown.previewUpdating') || 'Updating preview…',
                        'data-ocm-md-preview-busy': '1',
                      },
                    },
                    h('span', { class: 'ocm-toolbar__busy-spinner' })
                  )
                : null,
          });
        }
        ctx.own({
          destroy: () => {
            workspaceRef.current = null;
            surfaceHandle.destroy();
          },
        });
        ctx.on('docChanged', () => {
          surfaceHandle.update(ctx.editor.getState());
        });
        if (toolbarConfig) {
          // Wrap bare `command` items so CM debounce is flushed before kernel ops.
          const items = (toolbarConfig.items ?? []).map((item) => {
            if (item.onClick || item.run || typeof item.command !== 'string') {
              return item;
            }
            const name = item.command;
            return {
              ...item,
              command: undefined,
              run: ({ editor, workspace: ws }: MdToolbarActionApi) => {
                ws?.flushPendingSoT();
                if (!editor.command(name)) {
                  editor.notify('Could not apply toolbar action');
                  return;
                }
                ws?.focus();
              },
            };
          });
          applyToolbarConfig(ctx, { menus: toolbarConfig.menus, items }, () => ({
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
          md_embed: {
            render(attrs, wctx: WidgetContext) {
              const text = attrString(attrs.text, '# Markdown\n\nHello **world**.\n');
              return foreign((host, scope) => {
                mountMdEmbed(
                  host,
                  {
                    text,
                    path: wctx.path,
                    editor: wctx.editor,
                    onCommit: (next) => {
                      wctx.updateAttrs({ text: next });
                    },
                    labels: {
                      title: wctx.editor.t('markdown.insert'),
                    },
                  },
                  scope
                );
              });
            },
          },
        },
    publish: {
      node: 'md_embed',
      runtime: 'md-mermaid',
      render: (attrs) => renderMdEmbedPublish(attrs),
    },
  });
}

/** Default slim-app plugin set: workspace MarkdownPlugin. */
export function createDefaultPlugins(
  opts: {
    elements?: MdCustomElement[];
    toolbar?: MdToolbarOptions;
    preview?: MdRemotePreviewOptions;
  } = {}
): PluginDefinition[] {
  const elements = createMdElementRegistry(opts.elements ?? []);
  return [
    MarkdownPlugin({
      surface: 'workspace',
      elements: opts.elements,
      toolbar: opts.toolbar ?? defaultMdToolbar({ elements }),
      preview: opts.preview,
    }),
  ];
}
