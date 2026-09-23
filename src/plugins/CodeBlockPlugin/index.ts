import './style.scss';
import { definePlugin, insertAtomAfter, attrString, foreign } from '@on-codemerge/sdk';
import type { WidgetContext, ViewSpec } from '@on-codemerge/sdk';
import { CodeBlockModal } from './components/CodeBlockModal';
import { CodeBlockContextMenu } from './components/CodeBlockContextMenu';
import { SyntaxHighlighter } from './services/SyntaxHighlighter';
import { renderCodeBlockDom } from './widgets/renderCodeBlockDom';
import { replaceChildrenWithHtml } from '../../utils/domHtml';
import { insertIcon } from '../../icons';

export function CodeBlockPlugin() {
  const highlighter = new SyntaxHighlighter();
  let openModal:
    | ((code?: string, language?: string, onSave?: (c: string, l: string) => void) => void)
    | null = null;

  return definePlugin({
    commands: {
      insertCodeBlock: () => {
        openModal?.('', 'plaintext');
        return null;
      },
    },
    hotkeys: [{ keys: 'Mod-Alt-q', command: 'insertCodeBlock', description: 'Insert code block' }],
    name: 'code-block',
    nodes: [
      {
        name: 'code_block',
        group: 'atom',
        atom: true,
        attrs: { language: 'plaintext', code: '' },
      },
    ],
    setup(ctx) {
      const editor = ctx.editor;
      const modal = new CodeBlockModal(editor, ctx.scope);
      openModal = (code = '', language = 'plaintext', onSave?) => {
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
          const language = languageElement.textContent || 'plaintext';
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

      ctx.toolbar.add({
        id: 'code-block',
        icon: insertIcon,
        title: () => editor.t('codeBlock.insert'),
        menu: 'insert',
        order: 45,
        onClick: () => openModal?.(),
      });

      ctx.onDom('host', 'contextmenu', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) {
          return;
        }
        const codeBlock = target.closest('.code-block, [data-ocm-type="code_block"]');
        if (!(codeBlock instanceof HTMLElement)) {
          return;
        }
        e.preventDefault();
        contextMenu.show(codeBlock, e.clientX, e.clientY);
      });
    },
    widgets: {
      code_block: {
        render(attrs, wctx: WidgetContext): ViewSpec {
          const t = (k: string) => wctx.editor.t(k) || k;
          return foreign((host, scope) => {
            host.className = 'ocm-atom';
            const code = attrString(attrs.code);
            const language = attrString(attrs.language, 'plaintext');
            const openEdit = () => {
              openModal?.(code, language, (newCode, newLanguage) => {
                wctx.updateAttrs({ code: newCode, language: newLanguage });
              });
            };
            const block = renderCodeBlockDom(code, language, t, openEdit);
            host.append(block);
            const codeElement = block.querySelector('code');
            if (codeElement) {
              replaceChildrenWithHtml(codeElement, highlighter.highlightHtml(code, language));
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
