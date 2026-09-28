import { bracesIcon, listIcon, shortcutsIcon } from '@ocm/wysiwyg/icons';
import {
  changeTypeCommand,
  deleteNodeCommand,
  duplicateNodeCommand,
  insertItemCommand,
  insertPropertyCommand,
  moveItemCommand,
} from '../commands/jsonCommands';
import type { JsonWorkspaceHandle } from '../surface/workspaceView';
import type { JsonToolbarItem, JsonToolbarOptions } from './types';

export type DefaultJsonToolbarOptions = {
  /** Include Tree/Raw mode toggles (needs workspace + rawPane). Default true. */
  viewMode?: boolean;
  /** Include shortcuts help button. Default true. */
  shortcuts?: boolean;
};

/**
 * JSON domain toolbar preset (mode / format / structural).
 * Undo/redo come from `HistoryChromePlugin` — compose via `createDefaultPlugins`.
 */
export function defaultJsonToolbar(opts: DefaultJsonToolbarOptions = {}): JsonToolbarOptions {
  const viewMode = opts.viewMode !== false;
  const shortcuts = opts.shortcuts !== false;

  const items: JsonToolbarItem[] = [];

  if (shortcuts) {
    items.push({
      id: 'shortcuts',
      icon: shortcutsIcon,
      title: () => 'Keyboard shortcuts',
      group: 'history',
      order: 3,
      command: 'json.showShortcuts',
    });
  }

  if (viewMode) {
    items.push(
      {
        id: 'json-mode-tree',
        icon: listIcon,
        title: () => 'Tree',
        group: 'history',
        order: 4,
        run: ({ editor, workspace }) => {
          workspace?.setMode('tree');
          editor.toolbar.refresh();
        },
      },
      {
        id: 'json-mode-raw',
        icon: bracesIcon,
        title: () => 'Raw',
        group: 'history',
        order: 5,
        run: ({ editor, workspace }) => {
          workspace?.setMode('raw');
          editor.toolbar.refresh();
        },
      }
    );
  }

  items.push(
    {
      id: 'json-format-pretty',
      label: () => 'Pretty',
      title: () => 'Pretty-print JSON',
      menu: 'json-format',
      order: 10,
      command: 'json.formatPretty',
    },
    {
      id: 'json-format-compact',
      label: () => 'Compact',
      title: () => 'Compact JSON',
      menu: 'json-format',
      order: 20,
      command: 'json.formatCompact',
    },
    {
      id: 'json-insert-property',
      label: () => '+ key',
      title: () => 'Insert property',
      menu: 'json',
      order: 10,
      run: ({ editor }) => {
        if (!editor.run(insertPropertyCommand('property', null))) {
          editor.notify('Select an object (or unique key "property")');
        }
      },
    },
    {
      id: 'json-insert-item',
      label: () => '+ item',
      title: () => 'Insert item',
      menu: 'json',
      order: 20,
      run: ({ editor }) => {
        if (!editor.run(insertItemCommand(null))) {
          editor.notify('Select an array');
        }
      },
    },
    {
      id: 'json-duplicate',
      label: () => 'Dup',
      title: () => 'Duplicate node',
      menu: 'json',
      order: 30,
      run: ({ editor }) => {
        if (!editor.run(duplicateNodeCommand())) {
          editor.notify('Select a property or array item');
        }
      },
    },
    {
      id: 'json-delete',
      label: () => 'Del',
      title: () => 'Delete node',
      menu: 'json',
      order: 40,
      run: ({ editor }) => {
        if (!editor.run(deleteNodeCommand())) {
          editor.notify('Nothing to delete');
        }
      },
    },
    {
      id: 'json-to-object',
      label: () => '{}',
      title: () => 'Change to object',
      menu: 'json',
      order: 50,
      run: ({ editor }) => {
        editor.run(changeTypeCommand('jsonObject'));
      },
    },
    {
      id: 'json-to-array',
      label: () => '[]',
      title: () => 'Change to array',
      menu: 'json',
      order: 60,
      run: ({ editor }) => {
        editor.run(changeTypeCommand('jsonArray'));
      },
    },
    {
      id: 'json-move-down',
      label: () => '↓',
      title: () => 'Move item ↓',
      menu: 'json',
      order: 70,
      run: ({ editor }) => {
        if (!editor.run(moveItemCommand(1))) {
          editor.notify('Select an array item');
        }
      },
    },
    {
      id: 'json-move-up',
      label: () => '↑',
      title: () => 'Move item ↑',
      menu: 'json',
      order: 80,
      run: ({ editor }) => {
        if (!editor.run(moveItemCommand(-1))) {
          editor.notify('Select an array item');
        }
      },
    }
  );

  return {
    menus: [
      { id: 'json', label: () => 'JSON', order: 10 },
      { id: 'json-format', label: () => 'Format', order: 20 },
    ],
    items,
  };
}

/** Bind Tree/Raw `active` flags to a live workspace getter. */
export function bindJsonViewModeActive(
  toolbar: JsonToolbarOptions,
  workspace: () => JsonWorkspaceHandle | null
): JsonToolbarOptions {
  const modeOf = (want: 'tree' | 'raw') => (): boolean => workspace()?.getMode() === want;
  return {
    ...toolbar,
    items: (toolbar.items ?? []).map((item) => {
      if (item.id === 'json-mode-tree') {
        return { ...item, active: modeOf('tree') };
      }
      if (item.id === 'json-mode-raw') {
        return { ...item, active: modeOf('raw') };
      }
      return item;
    }),
  };
}
