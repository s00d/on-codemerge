import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';
import type { EditorState } from '@codemerge/kernel';
import { getNodeAt } from '@codemerge/kernel';

import { deleteIcon, duplicateIcon, insertIcon } from '@codemerge/sdk/icons';
import type { JsonNodeMenuTarget } from '../../components/JsonNodeMenu';
import {
  arrayIndex,
  chevron,
  containerBadge,
  iconBtn,
  iconBtnAccent,
  iconBtnClass,
  iconBtnDanger,
  rowActions,
  rowShell,
  typeChip,
} from './chrome';
import { leafValueView } from './leaves';
import { pathKey } from './types';
import type { TreeHandlers } from './types';

export function valueBranch(
  state: EditorState,
  path: number[],
  depth: number,
  handlers: TreeHandlers,
  opts: {
    leading?: ViewSpec[];
    menuTarget: JsonNodeMenuTarget;
    onDelete?: () => void;
    insertExtra?: ViewSpec[];
  }
): ViewSpec {
  const node = getNodeAt(state.doc, path);
  const leading = opts.leading ?? [];
  const collapsed = handlers.collapsed.has(pathKey(path));

  if (node.type === 'jsonObject' || node.type === 'jsonArray') {
    const extras: ViewSpec[] = [...(opts.insertExtra ?? [])];
    if (node.type === 'jsonObject') {
      extras.push(
        iconBtn(iconBtnAccent, 'Insert key', insertIcon, () => {
          handlers.runGuarded(() => {
            handlers.insertProperty(path);
          });
        })
      );
    } else {
      extras.push(
        iconBtn(iconBtnAccent, 'Insert item', insertIcon, () => {
          handlers.runGuarded(() => {
            handlers.insertItem(path);
          });
        })
      );
    }
    if (opts.onDelete) {
      extras.push(
        iconBtn(iconBtnDanger, 'Delete', deleteIcon, () => {
          handlers.runGuarded(() => {
            opts.onDelete?.();
          });
        })
      );
    }

    const row = rowShell(path, depth, handlers, [
      chevron(path, collapsed, handlers),
      ...leading,
      containerBadge(node),
      typeChip(node.type),
      rowActions(opts.menuTarget, handlers, extras),
    ]);

    if (collapsed) {
      return h('div', { class: 'flex flex-col' }, [row]);
    }

    const kids = (node.content ?? []).map((_, i) => {
      const childPath = [...path, i];
      if (node.type === 'jsonObject') {
        return propertyBranch(state, childPath, depth + 1, handlers);
      }
      return valueBranch(state, childPath, depth + 1, handlers, {
        leading: [arrayIndex(i)],
        menuTarget: { path: childPath, valuePath: childPath, kind: 'arrayItem' },
        onDelete: () => {
          handlers.deleteAt(childPath);
        },
        insertExtra: [
          iconBtn(iconBtnClass, 'Duplicate', duplicateIcon, () => {
            handlers.runGuarded(() => {
              handlers.duplicateAt(childPath);
            });
          }),
        ],
      });
    });

    return h('div', { class: 'flex flex-col' }, [row, ...kids]);
  }

  const extras: ViewSpec[] = [...(opts.insertExtra ?? [])];
  if (opts.onDelete) {
    extras.push(
      iconBtn(iconBtnDanger, 'Delete', deleteIcon, () => {
        handlers.runGuarded(() => {
          opts.onDelete?.();
        });
      })
    );
  }
  return rowShell(path, depth, handlers, [
    h('span', { class: 'inline-block size-5 shrink-0' }, ''),
    ...leading,
    leafValueView(node, path, handlers),
    typeChip(node.type),
    rowActions(opts.menuTarget, handlers, extras),
  ]);
}

export function propertyBranch(
  state: EditorState,
  path: number[],
  depth: number,
  handlers: TreeHandlers
): ViewSpec {
  const node = getNodeAt(state.doc, path);
  const key = typeof node.attrs?.key === 'string' ? node.attrs.key : '';
  const valuePath = [...path, 0];
  const valueNode = node.content?.[0];

  const keyInput = h('input', {
    class:
      'h-6 w-[9rem] max-w-[40%] shrink-0 truncate rounded-ocm-sm border border-ocm-border bg-ocm-surface px-1.5 font-mono text-[13px] text-violet-700 outline-none hover:border-ocm-text-muted focus-visible:border-sky-500 focus-visible:ring-1 focus-visible:ring-sky-400/40 dark:text-violet-300',
    attrs: {
      type: 'text',
      'aria-label': 'Property key',
      'data-ocm-json-interactive': 'true',
      spellcheck: 'false',
    },
    props: { value: key },
    on: {
      mousedown: (ev) => {
        ev.stopPropagation();
      },
      click: (ev) => {
        ev.stopPropagation();
      },
      change: (ev) => {
        const t = ev.target;
        if (t instanceof HTMLInputElement) {
          handlers.runGuarded(() => {
            handlers.rename(path, t.value);
          });
        }
      },
    },
  });
  const colon = h('span', { class: 'w-2 shrink-0 text-center text-ocm-text-muted/60' }, ':');

  if (!valueNode) {
    return rowShell(path, depth, handlers, [
      h('span', { class: 'inline-block size-5 shrink-0' }, ''),
      keyInput,
      colon,
      rowActions({ path, valuePath, kind: 'property' }, handlers, [
        iconBtn(iconBtnDanger, 'Delete', deleteIcon, () => {
          handlers.runGuarded(() => {
            handlers.deleteAt(path);
          });
        }),
      ]),
    ]);
  }

  const kind: JsonNodeMenuTarget['kind'] =
    valueNode.type === 'jsonObject'
      ? 'object'
      : valueNode.type === 'jsonArray'
        ? 'array'
        : 'property';

  return valueBranch(state, valuePath, depth, handlers, {
    leading: [keyInput, colon],
    menuTarget: { path, valuePath, kind },
    onDelete: () => {
      handlers.deleteAt(path);
    },
    insertExtra: [
      iconBtn(iconBtnClass, 'Duplicate', duplicateIcon, () => {
        handlers.runGuarded(() => {
          handlers.duplicateAt(path);
        });
      }),
    ],
  });
}

export function treeRootView(state: EditorState, handlers: TreeHandlers): ViewSpec {
  const jsonPath = [0];
  const jsonNode = getNodeAt(state.doc, jsonPath);
  if (jsonNode.type !== 'json') {
    return h('div', { class: 'px-3 py-4 text-sm text-red-600' }, 'Invalid JSON document');
  }
  const valuePath = [...jsonPath, 0];
  if (!jsonNode.content?.[0]) {
    return h('div', { class: 'px-3 py-4 text-sm text-ocm-text-muted' }, 'Empty');
  }
  const root = jsonNode.content[0];
  const kind: JsonNodeMenuTarget['kind'] =
    root.type === 'jsonObject' ? 'object' : root.type === 'jsonArray' ? 'array' : 'leaf';
  return h('div', { class: 'ocm-json-tree-root', attrs: { role: 'tree' } }, [
    valueBranch(state, valuePath, 0, handlers, {
      menuTarget: { path: valuePath, valuePath, kind },
    }),
  ]);
}
