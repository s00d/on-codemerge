import type { CalendarToolbarOptions } from './types';

/**
 * Calendar workspace toolbar — empty by default.
 * View / import / export / add live in the studio chrome; undo/redo from HistoryChromePlugin.
 * Pass a custom `toolbar` to CalendarPlugin / createDefaultPlugins to add bar actions.
 */
export function defaultCalendarToolbar(): CalendarToolbarOptions {
  return { items: [] };
}
