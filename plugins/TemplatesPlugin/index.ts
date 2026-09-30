import './style.scss';

import { definePlugin, attrString, foreign, pluginToolbarPlacement } from '@codemerge/sdk';
import type { ViewSpec, PluginToolbarOpts } from '@codemerge/sdk';
import { importHTML } from '@ocm/wysiwyg/io';
import { TemplatesMenu } from './components/TemplatesMenu';
import { TemplateManager } from './services/TemplateManager';
import { templatesIcon } from '@ocm/wysiwyg/icons';
import type { Template } from './types';

function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

export function TemplatesPlugin(opts?: PluginToolbarOpts) {
  const manager = new TemplateManager();
  let openTemplates: (() => void) | null = null;

  return definePlugin({
    name: 'templates',
    nodes: [
      {
        name: 'template',
        group: 'atom',
        atom: true,
        attrs: { payload: null, name: '' },
      },
    ],
    commands: {
      insertTemplate: () => {
        openTemplates?.();
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-m', command: 'insertTemplate', description: 'Insert template' }],
    setup(ctx) {
      const editor = ctx.editor;
      const menu = new TemplatesMenu(manager, editor, ctx.scope);
      openTemplates = () => {
        menu.show((template: Template) => {
          const content = template.content ?? '';
          if (content && looksLikeHtml(content)) {
            const doc = importHTML(content);
            const blocks = doc.content ?? [];
            const index = editor.getSelection().anchor.path[0] + 1;
            editor.run(() =>
              blocks.map((node, i) => ({
                type: 'insert_node' as const,
                path: [] as number[],
                index: index + i,
                node,
              }))
            );
            return;
          }
          // Plain text / markdown-ish → paragraph
          const text = content || template.name || 'Template';
          editor.run(() => [
            {
              type: 'insert_node',
              path: [],
              index: editor.getSelection().anchor.path[0] + 1,
              node: {
                type: 'paragraph',
                content: [{ type: 'text', text }],
              },
            },
          ]);
        });
      };
      ctx.toolbar.add({
        id: 'templates',
        icon: templatesIcon,
        title: () => editor.t('common.templates'),
        ...pluginToolbarPlacement({ menu: 'insert', order: 55 }, opts),
        onClick: () => openTemplates?.(),
      });
    },
    widgets: {
      // Placeholder atom chrome — insert expands content into prose; payload unused.
      template: {
        render(attrs): ViewSpec {
          return foreign((host) => {
            host.className = 'ocm-template-atom';
            host.textContent = attrString(attrs.name, 'Template');
          });
        },
      },
    },
  });
}
