import { clearIcon, desktopIcon, mobileIcon } from '@ocm/wysiwyg/icons';
import type { FormToolbarItem, FormToolbarOptions } from './types';

export type DefaultFormToolbarOptions = {
  /** Include wide/narrow preview toggles. Default true. */
  previewWidth?: boolean;
  /** Include clear-all-fields. Default true. */
  clear?: boolean;
};

/**
 * Forms workspace toolbar — only actions not already in the studio chrome.
 * Palette / Templates / method live in the workspace UI; undo/redo from HistoryChromePlugin.
 */
export function defaultFormToolbar(opts: DefaultFormToolbarOptions = {}): FormToolbarOptions {
  const previewWidth = opts.previewWidth !== false;
  const clear = opts.clear !== false;
  const items: FormToolbarItem[] = [];

  if (clear) {
    items.push({
      id: 'form-clear-fields',
      icon: clearIcon,
      title: () => 'Clear all fields',
      group: 'history',
      order: 10,
      run: ({ workspace }) => {
        workspace?.clearFields();
      },
    });
  }

  if (previewWidth) {
    items.push(
      {
        id: 'form-preview-wide',
        icon: desktopIcon,
        title: () => 'Wide preview',
        group: 'history',
        order: 20,
        run: ({ workspace }) => {
          workspace?.setNarrowPreview(false);
        },
      },
      {
        id: 'form-preview-narrow',
        icon: mobileIcon,
        title: () => 'Narrow preview',
        group: 'history',
        order: 21,
        run: ({ workspace }) => {
          workspace?.setNarrowPreview(true);
        },
      }
    );
  }

  return { menus: [], items };
}
