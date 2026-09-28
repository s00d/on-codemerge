import { attrString, h, mount } from '@on-codemerge/sdk';
import type { ViewSpec } from '@on-codemerge/sdk';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

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
 * Tiny static JSON highlighter (no CodeMirror).
 * Spans: key / string / number / literal / punct.
 */
export function highlightJsonHtml(source: string): string {
  const text = prettyJsonText(source);
  let out = '';
  let i = 0;
  let expectKey = false;
  while (i < text.length) {
    const ch = text.charAt(i);
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let esc = false;
      while (j < text.length) {
        const c = text.charAt(j);
        if (esc) {
          esc = false;
          j += 1;
          continue;
        }
        if (c === '\\') {
          esc = true;
          j += 1;
          continue;
        }
        if (c === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      const token = text.slice(i, j);
      let k = j;
      while (k < text.length && /\s/.test(text.charAt(k))) {
        k += 1;
      }
      const isKey = expectKey || text.charAt(k) === ':';
      const cls = isKey ? 'ocm-json-tok-key' : 'ocm-json-tok-string';
      out += `<span class="${cls}">${escapeHtml(token)}</span>`;
      i = j;
      expectKey = false;
      continue;
    }
    if (/[-0-9]/.test(ch)) {
      const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
      if (m) {
        out += `<span class="ocm-json-tok-number">${escapeHtml(m[0])}</span>`;
        i += m[0].length;
        expectKey = false;
        continue;
      }
    }
    if (/[a-zA-Z]/.test(ch)) {
      const m = /^(true|false|null)\b/.exec(text.slice(i));
      if (m) {
        out += `<span class="ocm-json-tok-literal">${m[0]}</span>`;
        i += m[0].length;
        expectKey = false;
        continue;
      }
    }
    if (ch === '{' || ch === '[') {
      expectKey = ch === '{';
      out += `<span class="ocm-json-tok-punct">${ch}</span>`;
      i += 1;
      continue;
    }
    if (ch === '}' || ch === ']') {
      expectKey = false;
      out += `<span class="ocm-json-tok-punct">${ch}</span>`;
      i += 1;
      continue;
    }
    if (ch === ',') {
      expectKey = true;
      out += `<span class="ocm-json-tok-punct">${ch}</span>`;
      i += 1;
      continue;
    }
    if (ch === ':') {
      expectKey = false;
      out += `<span class="ocm-json-tok-punct">${ch}</span>`;
      i += 1;
      continue;
    }
    out += escapeHtml(ch);
    i += 1;
  }
  return out;
}

/** Static published / preview markup — no Tree, no CodeMirror. */
export function renderJsonEmbedPublish(attrs: Record<string, unknown>): ViewSpec {
  const raw = attrString(attrs.text, 'null');
  const compact = compactJsonText(raw);
  const pretty = prettyJsonText(raw);
  const highlighted = highlightJsonHtml(pretty);
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

/** Paint highlight into an existing host (tests / optional hosts). */
export function mountJsonPublishPreview(host: HTMLElement, text: string): { destroy: () => void } {
  return mount(host, renderJsonEmbedPublish({ text }));
}
