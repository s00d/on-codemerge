export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Coerce unknown cell payloads to string (CSV/matrix import). */
export function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  return '';
}

/** Parse CSV into a string matrix (minimal RFC4180-ish). */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const d = delimiter || ',';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === undefined) {
      break;
    }
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === d) {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell);
      cell = '';
      if (row.some((c) => c.length > 0) || row.length > 1) {
        rows.push(row);
      }
      row = [];
      if (ch === '\r') {
        i += 1;
      }
      continue;
    }
    if (ch === '\r') {
      row.push(cell);
      cell = '';
      if (row.some((c) => c.length > 0) || row.length > 1) {
        rows.push(row);
      }
      row = [];
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.length > 0) || row.length > 1) {
    rows.push(row);
  }
  return rows;
}

/** Normalize JSON payloads into a rectangular string matrix. */
export function parseJsonToMatrix(
  data: unknown,
  preferHeaders = true
): {
  matrix: string[][];
  hasHeader: boolean;
} {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { matrix: [['']], hasHeader: false };
    }
    if (Array.isArray(data[0])) {
      const matrix = data.map((row) =>
        (Array.isArray(row) ? row : [row]).map((c) => stringifyCell(c))
      );
      return { matrix, hasHeader: preferHeaders };
    }
    if (data.every((row) => isPlainObject(row))) {
      const keys = [
        ...new Set(data.flatMap((row) => (isPlainObject(row) ? Object.keys(row) : []))),
      ];
      const matrix = [
        keys,
        ...data.map((row) => keys.map((k) => (isPlainObject(row) ? stringifyCell(row[k]) : ''))),
      ];
      return { matrix, hasHeader: true };
    }
    return {
      matrix: data.map((v) => [stringifyCell(v)]),
      hasHeader: false,
    };
  }
  if (isPlainObject(data) && Array.isArray(data.rows)) {
    const headers = Array.isArray(data.headers) ? data.headers.map((h) => stringifyCell(h)) : null;
    const body = data.rows.map((row) =>
      (Array.isArray(row) ? row : [row]).map((c) => stringifyCell(c))
    );
    if (headers !== null) {
      return { matrix: [headers, ...body], hasHeader: true };
    }
    return { matrix: body.length > 0 ? body : [['']], hasHeader: preferHeaders };
  }
  return { matrix: [[stringifyCell(data)]], hasHeader: false };
}

/** Escape a CSV field. */
export function escapeCsvField(value: string, delimiter = ','): string {
  if (
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.includes(delimiter)
  ) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function matrixToCsv(matrix: string[][], delimiter = ','): string {
  return matrix
    .map((row) => row.map((c) => escapeCsvField(c, delimiter)).join(delimiter))
    .join('\n');
}
