import type { DocNode } from '@codemerge/kernel';
import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';
import type { TreeHandlers } from '../surface/tree/types';

const fieldBase =
  'h-6 min-w-0 rounded-ocm-sm border border-ocm-border bg-ocm-surface px-1.5 font-mono text-[13px] outline-none hover:border-ocm-text-muted focus-visible:border-sky-500 focus-visible:ring-1 focus-visible:ring-sky-400/40';

function stopBubble(ev: Event): void {
  ev.stopPropagation();
}

export function stringLeafView(node: DocNode, path: number[], handlers: TreeHandlers): ViewSpec {
  return h('input', {
    class: `${fieldBase} max-w-[18rem] grow-0 text-emerald-800 dark:text-emerald-200`,
    style: { width: `${Math.min(28, Math.max(6, (node.text ?? '').length + 2))}ch` },
    attrs: {
      type: 'text',
      'aria-label': 'String value',
      'data-ocm-json-interactive': 'true',
    },
    props: { value: node.text ?? '' },
    on: {
      mousedown: stopBubble,
      click: stopBubble,
      change: (ev) => {
        const t = ev.target;
        if (t instanceof HTMLInputElement) {
          handlers.runGuarded(() => {
            handlers.setValue(path, t.value);
          });
        }
      },
    },
  });
}

export function numberLeafView(node: DocNode, path: number[], handlers: TreeHandlers): ViewSpec {
  const v = node.attrs?.value;
  const text = typeof v === 'number' && Number.isFinite(v) ? String(v) : '0';
  return h('input', {
    class: `${fieldBase} w-[7rem] shrink-0 tabular-nums text-amber-800 dark:text-amber-200`,
    attrs: {
      type: 'text',
      inputmode: 'decimal',
      'aria-label': 'Number value',
      'data-ocm-json-interactive': 'true',
    },
    props: { value: text },
    on: {
      mousedown: stopBubble,
      click: stopBubble,
      change: (ev) => {
        const t = ev.target;
        if (!(t instanceof HTMLInputElement)) {
          return;
        }
        const n = Number(t.value);
        if (Number.isFinite(n)) {
          handlers.runGuarded(() => {
            handlers.setValue(path, n);
          });
        } else {
          t.value = text;
        }
      },
    },
  });
}

export function booleanLeafView(node: DocNode, path: number[], handlers: TreeHandlers): ViewSpec {
  const v = node.attrs?.value === true;
  return h(
    'button',
    {
      class: [
        'inline-flex h-6 shrink-0 items-center rounded-ocm-sm border px-1.5 font-mono text-[12px] outline-none focus-visible:ring-1 focus-visible:ring-sky-400/50',
        v
          ? 'border-sky-500/40 bg-sky-600/15 text-sky-800 hover:bg-sky-600/25 dark:text-sky-200'
          : 'border-ocm-border bg-ocm-surface text-ocm-text-muted hover:bg-ocm-surface-hover',
      ].join(' '),
      attrs: {
        type: 'button',
        'aria-label': 'Boolean value',
        'aria-pressed': v ? 'true' : 'false',
        'data-ocm-json-interactive': 'true',
        title: 'Click to toggle',
      },
      on: {
        mousedown: stopBubble,
        click: (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          handlers.runGuarded(() => {
            handlers.setValue(path, !v);
          });
        },
      },
    },
    v ? 'true' : 'false'
  );
}

export function nullLeafView(): ViewSpec {
  return h(
    'span',
    {
      class: 'inline-flex h-6 items-center px-1 font-mono text-[12px] text-ocm-text-muted italic',
    },
    'null'
  );
}
