import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';
import type { DocNode } from '@codemerge/kernel';

import { moreHorizontalIcon } from '@codemerge/sdk/icons';
import type { JsonNodeMenuTarget } from '../../components/JsonNodeMenu';
import { isInteractiveTarget, pathsEqual, pathKey, typeLabel } from './types';
import type { TreeHandlers } from './types';

export const iconBtnClass =
  'inline-flex size-6 shrink-0 items-center justify-center rounded text-ocm-text-muted hover:bg-ocm-surface-hover hover:text-ocm-text [&_svg]:size-3.5';
export const iconBtnDanger =
  'inline-flex size-6 shrink-0 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 [&_svg]:size-3.5';
export const iconBtnAccent =
  'inline-flex size-6 shrink-0 items-center justify-center rounded text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/50 [&_svg]:size-3.5';

export function iconBtn(
  className: string,
  title: string,
  icon: string,
  onClick: (ev: MouseEvent) => void
): ViewSpec {
  return h('button', {
    class: className,
    attrs: { type: 'button', title, 'data-ocm-json-interactive': 'true' },
    props: { innerHTML: icon },
    on: {
      mousedown: (ev) => {
        ev.stopPropagation();
      },
      click: (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        onClick(ev);
      },
    },
  });
}

/** Compact type hint — not a control chrome. */
export function typeChip(type: string): ViewSpec {
  return h(
    'span',
    {
      class:
        'ocm-json-type shrink-0 select-none text-[10px] font-medium tracking-wide text-ocm-text-muted/80 lowercase',
    },
    typeLabel(type)
  );
}

export function containerBadge(node: DocNode): ViewSpec {
  const n = node.content?.length ?? 0;
  if (node.type === 'jsonObject') {
    return h(
      'span',
      {
        class: 'shrink-0 font-mono text-[12px] text-sky-700 tabular-nums dark:text-sky-300',
      },
      `{${n}}`
    );
  }
  return h(
    'span',
    {
      class: 'shrink-0 font-mono text-[12px] text-orange-700 tabular-nums dark:text-orange-300',
    },
    `[${n}]`
  );
}

export function rowActions(
  target: JsonNodeMenuTarget,
  handlers: TreeHandlers,
  extras: ViewSpec[]
): ViewSpec {
  return h(
    'span',
    {
      class:
        'ocm-json-actions ml-auto inline-flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [[aria-selected=true]_&]:opacity-100',
      attrs: { 'data-ocm-json-actions': 'true' },
    },
    [
      ...extras,
      iconBtn(iconBtnClass, 'More', moreHorizontalIcon, (ev) => {
        handlers.openMenu(target, ev.clientX, ev.clientY);
      }),
    ]
  );
}

export function rowShell(
  path: number[],
  depth: number,
  handlers: TreeHandlers,
  cells: ViewSpec[]
): ViewSpec {
  const isSelected = pathsEqual(handlers.selected, path);
  return h(
    'div',
    {
      class: [
        'ocm-json-row group relative flex h-7 items-center gap-1.5 border-l-2 border-transparent pr-1.5 font-mono text-[13px] leading-none text-ocm-text hover:bg-ocm-surface-muted/70',
        depth === 0 ? 'ocm-json-row--root' : '',
        isSelected ? 'is-selected border-l-sky-500 bg-sky-50/90 dark:bg-sky-950/35' : '',
      ]
        .filter(Boolean)
        .join(' '),
      attrs: {
        role: 'treeitem',
        tabindex: '0',
        'aria-selected': isSelected ? 'true' : 'false',
        'data-ocm-json-path': pathKey(path),
      },
      style: {
        '--ocm-json-depth': String(depth),
        paddingLeft: `calc(0.35rem + ${depth * 0.875}rem)`,
      },
      on: {
        click: (ev) => {
          if (isInteractiveTarget(ev.target)) {
            return;
          }
          handlers.select(path);
        },
        keydown: (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            handlers.select(path);
          }
        },
      },
    },
    cells
  );
}

export function chevron(path: number[], collapsed: boolean, handlers: TreeHandlers): ViewSpec {
  return h(
    'button',
    {
      class:
        'inline-flex size-5 shrink-0 items-center justify-center rounded text-[11px] text-ocm-text-muted hover:bg-ocm-surface-hover hover:text-ocm-text',
      attrs: {
        type: 'button',
        'aria-expanded': collapsed ? 'false' : 'true',
        'data-ocm-json-interactive': 'true',
        title: 'Toggle (Alt+click = subtree)',
      },
      on: {
        mousedown: (ev) => {
          ev.stopPropagation();
        },
        click: (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          handlers.toggleCollapse(path, ev.altKey);
        },
      },
    },
    collapsed ? '▸' : '▾'
  );
}

export function arrayIndex(i: number): ViewSpec {
  return h(
    'span',
    {
      class: 'inline-block w-4 shrink-0 text-right text-[11px] tabular-nums text-ocm-text-muted/70',
    },
    String(i)
  );
}
