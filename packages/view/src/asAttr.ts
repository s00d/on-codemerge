/** Coerce unknown attr values to string without Object stringification. */
export function asAttr(v: unknown, fallback = ''): string {
  return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
    ? String(v)
    : fallback;
}

/** Parse JSON text to unknown (avoids cascading `any` from JSON.parse). */
export function parseJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}
