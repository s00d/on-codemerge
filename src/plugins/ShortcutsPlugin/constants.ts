interface Shortcut {
  keys: string;
  description: string;
  command: string;
  icon: string;
}

type ShortcutCategories = {
  [category: string]: Shortcut[];
};

export const SHORTCUTS: ShortcutCategories = {
  'Text Formatting': [
    { keys: 'Ctrl+B', description: 'Bold text', command: 'bold', icon: '𝐁' },
    { keys: 'Ctrl+I', description: 'Italic text', command: 'italic', icon: '𝐼' },
    { keys: 'Ctrl+U', description: 'Underline text', command: 'underline', icon: 'U̲' },
    {
      keys: 'Ctrl+Shift+S',
      description: 'Strikethrough text',
      command: 'strikethrough',
      icon: 'S̶',
    },
    { keys: 'Ctrl+Shift+H', description: 'Highlight text', command: 'hilite-color', icon: '🖍️' },
  ],
  Alignment: [
    { keys: 'Ctrl+L', description: 'Align left', command: 'align_left', icon: '⬅️' },
    { keys: 'Ctrl+E', description: 'Align center', command: 'align_center', icon: '🔘' },
    { keys: 'Ctrl+R', description: 'Align right', command: 'align_right', icon: '➡️' },
  ],
  Lists: [
    { keys: 'Ctrl+Shift+U', description: 'Bulleted list', command: 'lists', icon: '•' },
    { keys: 'Ctrl+Shift+O', description: 'Numbered list', command: 'lists', icon: '1️⃣' },
  ],
  Media: [
    { keys: 'Ctrl+M', description: 'Insert image', command: 'image', icon: '🖼️' },
    { keys: 'Ctrl+Shift+V', description: 'Insert video', command: 'video', icon: '🎥' },
    {
      keys: 'Ctrl+Shift+Y',
      description: 'Insert YouTube video',
      command: 'youtube-video',
      icon: '▶️',
    },
  ],
  Links: [{ keys: 'Ctrl+K', description: 'Insert link', command: 'link', icon: '🔗' }],
  Blocks: [
    { keys: 'Ctrl+Shift+B', description: 'Insert block', command: 'block', icon: '🧱' },
    { keys: 'Ctrl+Shift+C', description: 'Insert code block', command: 'code-block', icon: '</>' },
  ],
  History: [
    { keys: 'Ctrl+Z', description: 'Undo', command: 'undo', icon: '↩️' },
    { keys: 'Ctrl+Y', description: 'Redo', command: 'redo', icon: '↪️' },
    { keys: 'Ctrl+H', description: 'View history', command: 'history', icon: '🕒' },
  ],
  Export: [{ keys: 'Ctrl+E', description: 'Export document', command: 'export', icon: '📤' }],
  Miscellaneous: [
    { keys: 'Ctrl+Shift+T', description: 'Insert template', command: 'templates', icon: '📄' },
    { keys: 'Ctrl+Shift+F', description: 'Upload file', command: 'file-upload', icon: '📎' },
    { keys: 'Ctrl+Shift+G', description: 'Insert chart', command: 'charts', icon: '📊' },
    { keys: 'Ctrl+Shift+M', description: 'Insert comment', command: 'comment', icon: '💬' },
    { keys: 'Ctrl+Shift+N', description: 'Insert footnote', command: 'footnotes', icon: '👣' },
    { keys: 'Ctrl+Shift+H', description: 'View HTML', command: 'html-viewer', icon: '🖥️' },
  ],
};
