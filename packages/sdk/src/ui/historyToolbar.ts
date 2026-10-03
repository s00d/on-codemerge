import type { Hotkey } from '../plugin';

/** Kernel undo/redo bindings — seed once in editor platform; do not re-declare per plugin. */
export const KERNEL_UNDO_REDO_HOTKEYS: Hotkey[] = [
  { keys: 'Mod-z', command: 'undo', description: 'Undo' },
  { keys: 'Mod-y', command: 'redo', description: 'Redo' },
  { keys: 'Mod-Shift-z', command: 'redo', description: 'Redo' },
];
