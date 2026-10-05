import { copyText } from '@codemerge/sdk';
import type { EditorAPI, MenuItem } from '@codemerge/sdk';
import { getNodeAt } from '@codemerge/kernel';

import { copyIcon, deleteIcon, duplicateIcon, insertIcon, moveIcon } from '@codemerge/sdk/icons';
import type { JsonLeafType } from '../commands/jsonCommands';
import {
  changeType,
  deleteNode,
  duplicateNode,
  insertItem,
  insertProperty,
  moveItem,
  pathToDot,
  pathToJsonPointer,
  valueAtDocPath,
} from '../commands/jsonCommands';
import { allJsonLeafTypes, getDriver } from '../drivers/registry';

export type JsonNodeMenuTarget = {
  /** Path for structural ops (property, array item, or container value). */
  path: number[];
  /** Value path for type change. */
  valuePath: number[];
  kind: 'property' | 'arrayItem' | 'object' | 'array' | 'leaf';
};

const TYPE_OPTIONS: { type: JsonLeafType; label: string }[] = allJsonLeafTypes().map((type) => ({
  type,
  label: getDriver(type).label,
}));

function uniquePropertyKey(editor: EditorAPI, objectPath: number[]): string | null {
  let objectNode;
  try {
    objectNode = getNodeAt(editor.getState().doc, objectPath);
  } catch {
    return null;
  }
  if (objectNode.type !== 'jsonObject') {
    return null;
  }
  const existing = new Set(
    (objectNode.content ?? [])
      .map((p) => p.attrs?.key)
      .filter((k): k is string => typeof k === 'string')
  );
  let key = 'property';
  let n = 1;
  while (existing.has(key)) {
    n += 1;
    key = `property${n}`;
  }
  return key;
}

/**
 * Shared ⋮ / context menu for a JSON tree node.
 * Do NOT call setSelection before open — keep path in the target closure.
 */
export class JsonNodeMenu {
  constructor(private readonly editor: EditorAPI) {}

  open(target: JsonNodeMenuTarget, x: number, y: number): void {
    const doc = this.editor.getState().doc;
    const items: MenuItem[] = [
      {
        label: 'Type',
        subMenu: TYPE_OPTIONS.map(({ type, label }) => ({
          label,
          onClick: () => {
            this.editor.run(changeType(target.valuePath, type));
          },
        })),
      },
      { type: 'divider' },
    ];

    if (target.kind === 'object') {
      items.push({
        label: 'Insert key',
        icon: insertIcon,
        onClick: () => {
          const key = uniquePropertyKey(this.editor, target.valuePath);
          if (key) {
            this.editor.run(insertProperty(target.valuePath, key, null));
          }
        },
      });
    } else if (target.kind === 'property') {
      items.push({
        label: 'Insert sibling key',
        icon: insertIcon,
        onClick: () => {
          const objectPath = target.path.slice(0, -1);
          const key = uniquePropertyKey(this.editor, objectPath);
          if (key) {
            this.editor.run(insertProperty(objectPath, key, null));
          }
        },
      });
    } else if (target.kind === 'array') {
      items.push({
        label: 'Insert item',
        icon: insertIcon,
        onClick: () => {
          this.editor.run(insertItem(target.valuePath, null));
        },
      });
    } else if (target.kind === 'arrayItem') {
      items.push({
        label: 'Insert item after',
        icon: insertIcon,
        onClick: () => {
          const parent = target.path.slice(0, -1);
          const idx = target.path.at(-1) ?? 0;
          this.editor.run(insertItem(parent, null, idx + 1));
        },
      });
    }

    if (target.kind === 'property' || target.kind === 'arrayItem') {
      items.push({
        label: 'Duplicate',
        icon: duplicateIcon,
        onClick: () => {
          this.editor.run(duplicateNode(target.path));
        },
      });
    }

    if (target.kind === 'arrayItem') {
      const idx = target.path.at(-1) ?? 0;
      const parent = target.path.slice(0, -1);
      let len = 0;
      try {
        len = getNodeAt(doc, parent).content?.length ?? 0;
      } catch {
        len = 0;
      }
      items.push(
        {
          label: 'Move up',
          icon: moveIcon,
          disabled: idx <= 0,
          onClick: () => {
            this.editor.run(moveItem(parent, idx, idx - 1));
          },
        },
        {
          label: 'Move down',
          icon: moveIcon,
          disabled: idx >= len - 1,
          onClick: () => {
            this.editor.run(moveItem(parent, idx, idx + 1));
          },
        }
      );
    }

    items.push(
      { type: 'divider' },
      {
        label: 'Copy path',
        icon: copyIcon,
        onClick: () => {
          const dot = pathToDot(doc, target.path);
          const pointer = pathToJsonPointer(doc, target.path);
          void (async () => {
            const ok = await copyText(pointer || dot);
            this.editor.notify(ok ? 'Path copied' : 'Clipboard unavailable');
          })();
        },
      },
      {
        label: 'Copy value',
        icon: copyIcon,
        onClick: () => {
          const value = valueAtDocPath(doc, target.valuePath);
          void (async () => {
            const ok = await copyText(JSON.stringify(value, null, 2));
            this.editor.notify(ok ? 'Value copied' : 'Clipboard unavailable');
          })();
        },
      },
      { type: 'divider' },
      {
        label: 'Delete',
        icon: deleteIcon,
        variant: 'danger',
        disabled: target.path.length <= 1,
        onClick: () => {
          this.editor.run(deleteNode(target.path));
        },
      }
    );

    this.editor.ui.menu.open(items, x, y);
  }

  destroy(): void {
    this.editor.ui.menu.hide();
  }
}
