const CHAR_W = 7.2;
const LINE_H = 16;

/** Split on `\n` without allocating when label has no breaks. */
export function labelLines(label: string): string[] {
  if (label.indexOf('\n') === -1) {
    return label === '' ? [''] : [label];
  }
  return label.split('\n');
}

export function measureLabel(
  label: string,
  minW = 48,
  padX = 20,
  padY = 16
): { width: number; height: number; lines: string[] } {
  const lines = labelLines(label);
  let max = 0;
  for (const line of lines) {
    max = Math.max(max, line.length);
  }
  return {
    width: Math.max(minW, Math.ceil(max * CHAR_W) + padX),
    height: Math.max(28, lines.length * LINE_H + padY),
    lines,
  };
}
