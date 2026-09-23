import './style.scss';

import { definePlugin, attrString, foreign } from '@on-codemerge/sdk';
import type { ViewSpec } from '@on-codemerge/sdk';
import { htmlToDoc } from '../../io/html';
import { TemplatesMenu } from './components/TemplatesMenu';
import { TemplateManager } from './services/TemplateManager';
import { templatesIcon } from '../../icons';
import type { Template } from './types';

function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

export function TemplatesPlugin() {
  const manager = new TemplateManager();
  let openTemplates: (() => void) | null = null;

  return definePlugin({
    name: 'templates',
    nodes: [
      {
        name: 'template',
        group: 'atom',
        atom: true,
        attrs: { payload: '', name: '' },
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
            const doc = htmlToDoc(content);
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
        title: editor.t('common.templates'),
        menu: 'insert',
        order: 55,
        onClick: () => openTemplates?.(),
      });
    },
    widgets: {
      // Legacy atoms (if any) — show name, not raw payload dump
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
