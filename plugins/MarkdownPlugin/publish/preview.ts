import { attrString, h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';

import { compactMarkdownText, prettyMarkdownText, renderMarkdownPreviewHtml } from '../io/preview';

/** Static published / preview markup. */
export function renderMdEmbedPublish(attrs: Record<string, unknown>): ViewSpec {
  const raw = attrString(attrs.text, '');
  const compact = compactMarkdownText(raw);
  const pretty = prettyMarkdownText(raw);
  const bodyHtml = renderMarkdownPreviewHtml(pretty);
  return h(
    'div',
    {
      class: 'ocm-md-publish',
      attrs: {
        'data-node': 'md_embed',
        'data-text': compact,
        'data-ocm-runtime': 'md-mermaid',
      },
    },
    [
      h('div', { class: 'ocm-md-publish__header' }, [
        h('span', { class: 'ocm-md-publish__badge' }, 'Markdown'),
      ]),
      h('div', {
        class: 'ocm-md-publish__body ocm-md-preview',
        props: { innerHTML: bodyHtml },
      }),
    ]
  );
}
