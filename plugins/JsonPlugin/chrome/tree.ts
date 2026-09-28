import { getNodeAt } from '@on-codemerge/kernel';
import type { EditorAPI, PluginContext } from '@on-codemerge/sdk';
import { JsonNodeMenu } from '../components/JsonNodeMenu';
import type { JsonNodeMenuTarget } from '../components/JsonNodeMenu';

function menuTargetFromSelection(editor: EditorAPI): JsonNodeMenuTarget | null {
  const path = editor.getState().selection.anchor.path;
  if (path.length === 0) {
    return null;
  }
  let node;
  try {
    node = getNodeAt(editor.getState().doc, path);
  } catch {
    return null;
  }
  if (node.type === 'jsonProperty') {
    return { path, valuePath: [...path, 0], kind: 'property' };
  }
  if (node.type === 'jsonObject') {
    return { path, valuePath: path, kind: 'object' };
  }
  if (node.type === 'jsonArray') {
    return { path, valuePath: path, kind: 'array' };
  }
  const parentPath = path.slice(0, -1);
  let parent;
  try {
    parent = getNodeAt(editor.getState().doc, parentPath);
  } catch {
    return { path, valuePath: path, kind: 'leaf' };
  }
  if (parent.type === 'jsonArray') {
    return { path, valuePath: path, kind: 'arrayItem' };
  }
  return { path, valuePath: path, kind: 'leaf' };
}

function menuTargetFromPath(editor: EditorAPI, path: number[]): JsonNodeMenuTarget | null {
  try {
    const node = getNodeAt(editor.getState().doc, path);
    if (node.type === 'jsonProperty') {
      return { path, valuePath: [...path, 0], kind: 'property' };
    }
    if (node.type === 'jsonObject') {
      return { path, valuePath: path, kind: 'object' };
    }
    if (node.type === 'jsonArray') {
      return { path, valuePath: path, kind: 'array' };
    }
    const parentPath = path.slice(0, -1);
    let parent;
    try {
      parent = getNodeAt(editor.getState().doc, parentPath);
    } catch {
      parent = null;
    }
    return parent?.type === 'jsonArray'
      ? { path, valuePath: path, kind: 'arrayItem' }
      : { path, valuePath: path, kind: 'leaf' };
  } catch {
    return null;
  }
}

/** Context menu on the JSON tree (toolbar buttons come from `toolbar` config). */
export function setupTreeContextMenu(ctx: PluginContext): void {
  const editor = ctx.editor;
  const nodeMenu = new JsonNodeMenu(editor);
  ctx.own({
    destroy: () => {
      nodeMenu.destroy();
    },
  });

  ctx.onDom('content', 'contextmenu', (ev) => {
    const t = ev.target;
    if (!(t instanceof Element) || !t.closest('.ocm-json-tree')) {
      return;
    }
    ev.preventDefault();
    let target = menuTargetFromSelection(editor);
    const row = t.closest('[data-ocm-json-path]');
    if (row instanceof HTMLElement) {
      const raw = row.getAttribute('data-ocm-json-path');
      if (raw) {
        const path = raw.split('.').map(Number);
        if (path.every((n) => Number.isFinite(n))) {
          target = menuTargetFromPath(editor, path) ?? target;
        }
      }
    }
    if (target) {
      nodeMenu.open(target, ev.clientX, ev.clientY);
    }
  });
}
