import { attrString, h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';
import { highlightHtml } from '@codemerge/editor';

/** Pretty-print when valid JSON; otherwise return trimmed raw. */
export function prettyJsonText(raw: string): string {
  const trimmed = raw.trim() || 'null';
  try {
    return `${JSON.stringify(JSON.parse(trimmed), null, 2)}\n`;
  } catch {
    return raw;
  }
}

/** Single-line JSON for `data-text` attrs (no newlines in HTML attributes). */
export function compactJsonText(raw: string): string {
  const trimmed = raw.trim() || 'null';
  try {
    return JSON.stringify(JSON.parse(trimmed));
  } catch {
    return trimmed.replaceAll(/\s+/g, ' ');
  }
}

/**
 * Static JSON highlight via universal structural engine.
 */
/** Static published / preview markup — no Tree UI. */
export function renderJsonEmbedPublish(attrs: Record<string, unknown>): ViewSpec {
  const raw = attrString(attrs.text, 'null');
  const compact = compactJsonText(raw);
  const pretty = prettyJsonText(raw);
  const highlighted = highlightHtml(pretty);
  return h(
    'div',
    {
      class: 'ocm-json-publish',
      attrs: {
        'data-node': 'json_embed',
        'data-text': compact,
      },
    },
    [
      h('div', { class: 'ocm-json-publish__header' }, [
        h('span', { class: 'ocm-json-publish__badge' }, 'JSON'),
      ]),
      h('pre', { class: 'ocm-json-publish__pre' }, [
        h('code', {
          class: 'language-json',
          props: { innerHTML: highlighted },
        }),
      ]),
    ]
  );
}
