/**
 * Insert a template with `#` holes (→ empty `{}` groups) at caret.
 * Caret lands inside the first `{}`.
 */
export function insertWithHoles(
  value: string,
  cursor: number,
  template: string
): { value: string; start: number; end: number } {
  const filled = template.replaceAll('#', '');
  const before = value.slice(0, cursor);
  const after = value.slice(cursor);
  const next = before + filled + after;
  const brace = filled.indexOf('{}');
  if (brace !== -1) {
    const pos = before.length + brace + 1;
    return { value: next, start: pos, end: pos };
  }
  const pos = before.length + filled.length;
  return { value: next, start: pos, end: pos };
}
