export interface TableStyle {
  id: string;
  name: string;
  className: string;
  preview: string;
  description: string;
}

export interface TableTheme {
  id: string;
  name: string;
  className: string;
  preview: string;
  description: string;
}

export const TABLE_STYLES: TableStyle[] = [
  {
    id: 'default',
    name: 'Default',
    className: 'table-default',
    preview: '📊',
    description: 'Standard table with clean borders',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    className: 'table-minimal',
    preview: '📋',
    description: 'Clean design with minimal borders',
  },
  {
    id: 'bordered',
    name: 'Bordered',
    className: 'table-bordered',
    preview: '📐',
    description: 'Heavy borders for emphasis',
  },
  {
    id: 'striped',
    name: 'Striped',
    className: 'table-striped',
    preview: '🦓',
    description: 'Alternating row colors',
  },
  {
    id: 'hover',
    name: 'Hover',
    className: 'table-hover',
    preview: '👆',
    description: 'Interactive hover effects',
  },
  {
    id: 'compact',
    name: 'Compact',
    className: 'table-compact',
    preview: '📦',
    description: 'Tight spacing for dense data',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    className: 'table-elegant',
    preview: '✨',
    description: 'Sophisticated design with shadows',
  },
  {
    id: 'modern',
    name: 'Modern',
    className: 'table-modern',
    preview: '🚀',
    description: 'Contemporary flat design',
  },
];

export const TABLE_THEMES: TableTheme[] = [
  {
    id: 'light',
    name: 'Light',
    className: 'theme-light',
    preview: '☀️',
    description: 'Light theme with white background',
  },
  {
    id: 'dark',
    name: 'Dark',
    className: 'theme-dark',
    preview: '🌙',
    description: 'Dark theme with dark background',
  },
  {
    id: 'blue',
    name: 'Blue',
    className: 'theme-blue',
    preview: '🔵',
    description: 'Blue accent colors',
  },
  {
    id: 'green',
    name: 'Green',
    className: 'theme-green',
    preview: '🟢',
    description: 'Green accent colors',
  },
  {
    id: 'purple',
    name: 'Purple',
    className: 'theme-purple',
    preview: '🟣',
    description: 'Purple accent colors',
  },
  {
    id: 'orange',
    name: 'Orange',
    className: 'theme-orange',
    preview: '🟠',
    description: 'Orange accent colors',
  },
];

export const CELL_ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left', icon: '⬅️' },
  { value: 'center', label: 'Center', icon: '↔️' },
  { value: 'right', label: 'Right', icon: '➡️' },
  { value: 'justify', label: 'Justify', icon: '↔️' },
];

export const VERTICAL_ALIGNMENT_OPTIONS = [
  { value: 'top', label: 'Top', icon: '⬆️' },
  { value: 'middle', label: 'Middle', icon: '↕️' },
  { value: 'bottom', label: 'Bottom', icon: '⬇️' },
];

export const BORDER_STYLES = [
  { value: 'none', label: 'None', icon: '❌' },
  { value: 'solid', label: 'Solid', icon: '▬' },
  { value: 'dashed', label: 'Dashed', icon: '┄' },
  { value: 'dotted', label: 'Dotted', icon: '┈' },
  { value: 'double', label: 'Double', icon: '═' },
];

export const BORDER_WIDTHS = [
  { value: '1px', label: 'Thin' },
  { value: '2px', label: 'Medium' },
  { value: '3px', label: 'Thick' },
  { value: '4px', label: 'Extra Thick' },
];

export class TableStyles {
  public setAlignment(cell: HTMLElement, align: 'left' | 'center' | 'right'): void {
    cell.style.textAlign = align;
  }

  public setVerticalAlignment(cell: HTMLElement, align: 'top' | 'middle' | 'bottom'): void {
    cell.style.verticalAlign = align;
  }

  public setBackground(cell: HTMLElement, color: string): void {
    cell.style.backgroundColor = color;
  }
}
