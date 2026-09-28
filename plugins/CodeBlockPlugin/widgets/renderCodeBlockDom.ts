import { h, renderDetached } from '@on-codemerge/sdk';

export function renderCodeBlockDom(
  code: string,
  language: string,
  t: (k: string) => string,
  onEdit?: () => void
): HTMLElement {
  const uniqueId = `code-block-${Math.random().toString(36).slice(2, 11)}`;
  const copyLabel = t('common.copy');
  const copied = t('common.copied');

  const { el } = renderDetached(
    h('div', { class: 'code-block', attrs: { id: uniqueId } }, [
      h('div', { class: 'code-header' }, [
        h('span', { class: 'code-language' }, language),
        h(
          'button',
          {
            class: 'copy-button',
            attrs: {
              type: 'button',
              title: t('common.copyToClipboard'),
            },
            on: {
              click: (e) => {
                e.stopPropagation();
                const btn = e.currentTarget;
                if (!(btn instanceof HTMLButtonElement)) {
                  return;
                }
                const codeElement = document.querySelector(`#${uniqueId}`)?.querySelector('code');
                if (!codeElement) {
                  return;
                }
                void navigator.clipboard.writeText(codeElement.textContent || '');
                btn.textContent = copied;
                globalThis.setTimeout(() => {
                  btn.textContent = copyLabel;
                }, 2000);
              },
            },
          },
          copyLabel
        ),
      ]),
      h('pre', null, [
        h('code', {
          class: `language-${language}`,
          // Read-only in the surface — edits go through the modal (dblclick / context menu).
          props: { contentEditable: false, textContent: code },
          on: {
            dblclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit?.();
            },
          },
        }),
      ]),
    ])
  );
  return el;
}
