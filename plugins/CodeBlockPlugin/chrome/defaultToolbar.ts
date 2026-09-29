import {
  clearIcon,
  copyIcon,
  editIcon,
  exportIcon,
  fileIcon,
  listIcon,
  textIcon,
  uploadIcon,
} from '@ocm/wysiwyg/icons';
import type { CodeToolbarItem, CodeToolbarOptions } from './types';

/**
 * Code Editor toolbar preset.
 * Undo/redo come from HistoryChromePlugin.
 * Bar shows Edit / File menus (like JSON Format / JSON); items live in menus.
 */
export function defaultCodeToolbar(): CodeToolbarOptions {
  const items: CodeToolbarItem[] = [
    {
      id: 'code-copy-all',
      icon: copyIcon,
      label: () => 'Copy',
      title: () => 'Copy all',
      menu: 'code-edit',
      order: 10,
      run: ({ workspace }) => {
        workspace?.copyAll();
      },
    },
    {
      id: 'code-select-all',
      icon: textIcon,
      label: () => 'Select all',
      title: () => 'Select all',
      menu: 'code-edit',
      order: 20,
      run: ({ workspace }) => {
        workspace?.selectAll();
      },
    },
    {
      id: 'code-clear',
      icon: clearIcon,
      label: () => 'Clear',
      title: () => 'Clear buffer',
      menu: 'code-edit',
      order: 30,
      run: ({ workspace }) => {
        workspace?.clear();
      },
    },
    {
      id: 'code-indent',
      icon: listIcon,
      label: () => 'Indent',
      title: () => 'Indent selection',
      menu: 'code-edit',
      order: 40,
      run: ({ workspace }) => {
        workspace?.indent();
      },
    },
    {
      id: 'code-outdent',
      icon: listIcon,
      label: () => 'Outdent',
      title: () => 'Outdent selection',
      menu: 'code-edit',
      order: 50,
      run: ({ workspace }) => {
        workspace?.outdent();
      },
    },
    {
      id: 'code-download',
      icon: exportIcon,
      label: () => 'Download',
      title: () => 'Download as file',
      menu: 'code-file',
      order: 10,
      run: ({ workspace }) => {
        workspace?.flushPendingSoT();
        workspace?.download();
      },
    },
    {
      id: 'code-upload',
      icon: uploadIcon,
      label: () => 'Upload',
      title: () => 'Upload file',
      menu: 'code-file',
      order: 20,
      run: ({ workspace }) => {
        workspace?.flushPendingSoT();
        workspace?.upload();
      },
    },
  ];

  return {
    menus: [
      { id: 'code-edit', label: () => 'Edit', icon: editIcon, order: 10 },
      { id: 'code-file', label: () => 'File', icon: fileIcon, order: 20 },
    ],
    items,
  };
}
