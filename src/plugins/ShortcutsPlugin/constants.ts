interface Shortcut {
  keys: string;
  description: string;
  command: string;
}

type ShortcutCategories = {
  [category: string]: Shortcut[];
};

export const SHORTCUTS: ShortcutCategories = {
  'Text Formatting': [
    { keys: 'Ctrl+B', description: 'Bold', command: 'bold' },
    { keys: 'Ctrl+I', description: 'Italic', command: 'italic' },
    { keys: 'Ctrl+U', description: 'Underline', command: 'underline' },
    { keys: 'Ctrl+K', description: 'Insert Link', command: '' },
  ],
  'Lists & Tables': [
    { keys: 'Ctrl+Shift+7', description: 'Numbered List', command: '' },
    { keys: 'Ctrl+Shift+8', description: 'Bullet List', command: '' },
    { keys: 'Ctrl+Shift+T', description: 'Insert Table', command: '' },
    { keys: 'Tab', description: 'Next Cell (in table)', command: '' },
    { keys: 'Shift+Tab', description: 'Previous Cell (in table)', command: '' },
  ],
  'History & Navigation': [
    { keys: 'Ctrl+Z', description: 'Undo', command: 'undo' },
    { keys: 'Ctrl+Shift+Z', description: 'Redo', command: 'redo' },
    { keys: 'Ctrl+H', description: 'History Panel', command: '' },
    { keys: 'Ctrl+F', description: 'Find', command: '' },
  ],
  'Media & Files': [
    { keys: 'Ctrl+Shift+I', description: 'Insert Image', command: '' },
    { keys: 'Ctrl+Shift+F', description: 'Upload File', command: '' },
    { keys: 'Ctrl+Shift+C', description: 'Insert Chart', command: '' },
  ],
  'View & Tools': [
    { keys: 'Ctrl+/', description: 'Show Shortcuts', command: '' },
    { keys: 'Ctrl+E', description: 'Export', command: '' },
    { keys: 'Ctrl+R', description: 'Responsive View', command: '' },
    { keys: 'Ctrl+\\', description: 'HTML View', command: '' },
  ],
  Color: [
    { keys: 'Ctrl+C', description: 'fore Color', command: 'foreColor' },
    { keys: 'Ctrl+H', description: 'hilite Color', command: 'hiliteColor' },
  ],
};
