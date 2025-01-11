export interface FormattingOptions {
  indentSize: number;
  maxLineLength: number;
}

export interface Shortcut {
  keys: string;
  keysMac?: string;
  description: string;
  command: string;
  icon: string;
}

export type ShortcutCategories = {
  [category: string]: Shortcut[];
};
