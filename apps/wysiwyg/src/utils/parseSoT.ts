export class ParseError extends Error {
  readonly name = 'ParseError';
  readonly offset: number | undefined;

  constructor(message: string, offset?: number) {
    super(message);
    this.offset = offset;
  }
}

export type JsonPayloadResult =
  | { ok: true; empty: true }
  | { ok: true; empty: false; value: unknown }
  | { ok: false; message: string };

export function parseJsonPayload(
  text: string,
  maxBytes: number,
  tooLarge: string
): JsonPayloadResult {
  if (text.length > maxBytes) {
    return { ok: false, message: tooLarge };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: true, empty: true };
  }
  try {
    return { ok: true, empty: false, value: JSON.parse(trimmed) };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Invalid JSON' };
  }
}
