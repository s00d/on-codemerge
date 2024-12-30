export const CHART_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
];

export function getRandomColor(): string {
  return CHART_COLORS[Math.floor(Math.random() * CHART_COLORS.length)];
}

export function colorWithOpacity(color: string | undefined, opacity: number): string {
  if (!color) {
    color = getRandomColor();
  }

  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const values = color.match(/\d+/g);
    if (!values || values.length < 3) return color;
    return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${opacity})`;
  }

  return color;
}
