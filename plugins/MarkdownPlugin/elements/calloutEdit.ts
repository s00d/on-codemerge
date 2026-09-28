/** Find enclosing `:::kind` … `:::` around `pos` (UTF-16 index). */
export function findCalloutAt(
  text: string,
  pos: number
): { from: number; to: number; kind: string } | null {
  const lines = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  let offset = 0;
  let openIdx = -1;
  let openKind = '';
  let openFrom = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const lineStart = offset;
    const lineEnd = offset + line.length + (i < lines.length - 1 ? 1 : 0);
    const open = /^:::([a-z][a-z0-9_-]*)(?:\s+.*)?$/i.exec(line.trimEnd());
    if (open && openIdx < 0) {
      openIdx = i;
      openKind = (open[1] ?? '').toLowerCase();
      openFrom = lineStart;
    } else if (openIdx >= 0 && line.trim() === ':::') {
      const blockTo = lineEnd;
      if (pos >= openFrom && pos <= blockTo) {
        return { from: openFrom, to: blockTo, kind: openKind };
      }
      openIdx = -1;
      openKind = '';
    }
    offset = lineEnd;
  }
  return null;
}

/** Replace opening `:::kind` of the callout under `pos` with `:::nextKind`. */
export function changeCalloutKindAt(
  text: string,
  pos: number,
  nextKind: string,
  known: Set<string>
): { text: string; cursor: number } | null {
  const id = nextKind.trim().toLowerCase();
  if (!known.has(id)) {
    return null;
  }
  const hit = findCalloutAt(text, pos);
  if (!hit || !known.has(hit.kind)) {
    return null;
  }
  if (hit.kind === id) {
    return { text, cursor: pos };
  }
  const slice = text.slice(hit.from, hit.to);
  const replaced = slice.replace(/^:::([a-z][a-z0-9_-]*)/i, `:::${id}`);
  if (replaced === slice) {
    return null;
  }
  const next = text.slice(0, hit.from) + replaced + text.slice(hit.to);
  const delta = replaced.length - slice.length;
  return { text: next, cursor: Math.min(pos + delta, next.length) };
}
