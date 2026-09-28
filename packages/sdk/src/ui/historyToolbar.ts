import type { Hotkey } from '../plugin';
import type { EditorAPI } from '../types';
import type { ToolbarText } from './toolbar';
import type { ToolbarConfigItem } from './toolbarConfig';

/** Kernel undo/redo bindings — seed once in editor platform; do not re-declare per plugin. */
export const KERNEL_UNDO_REDO_HOTKEYS: Hotkey[] = [
  { keys: 'Mod-z', command: 'undo', description: 'Undo' },
  { keys: 'Mod-y', command: 'redo', description: 'Redo' },
  { keys: 'Mod-Shift-z', command: 'redo', description: 'Redo' },
];

export type HistoryToolbarIcons = { undo: string; redo: string };

type HistoryApi = { editor: Pick<EditorAPI, 'undo' | 'redo'> };

/** Shared undo/redo bar items (HistoryPlugin + HistoryChromePlugin + presets). */
export function historyToolbarItems<TApi extends HistoryApi>(
  icons: HistoryToolbarIcons,
  titles?: { undo?: ToolbarText; redo?: ToolbarText }
): ToolbarConfigItem<TApi>[] {
  return [
    {
      id: 'undo',
      icon: icons.undo,
      title: titles?.undo ?? (() => 'Undo'),
      group: 'history',
      order: 1,
      run: ({ editor }) => {
        editor.undo();
      },
    },
    {
      id: 'redo',
      icon: icons.redo,
      title: titles?.redo ?? (() => 'Redo'),
      group: 'history',
      order: 2,
      run: ({ editor }) => {
        editor.redo();
      },
    },
  ];
}
