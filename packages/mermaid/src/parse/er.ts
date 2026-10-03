import { eqIgnoreCase, restTrim, skipWs, takeId } from '../scan';
import type { ErEntity, ErIR, ErRel, ParseDiagnostic } from '../types';

function isCardChar(c: string | undefined): boolean {
  return c === '|' || c === 'o' || c === '{' || c === '}';
}

/** Skip cardinality token like `||--o{` between entity ids. */
function skipCardinality(line: string, i: number): number | null {
  i = skipWs(line, i);
  const start = i;
  while (i < line.length && isCardChar(line[i])) {
    i += 1;
  }
  if (i === start) {
    return null;
  }
  i = skipWs(line, i);
  if (!line.startsWith('--', i)) {
    return null;
  }
  i += 2;
  i = skipWs(line, i);
  const mid = i;
  while (i < line.length && isCardChar(line[i])) {
    i += 1;
  }
  if (i === mid) {
    return null;
  }
  return i;
}

export function parseEr(source: string): { ir: ErIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  const entities = new Map<string, ErEntity>();
  const relations: ErRel[] = [];
  let current: ErEntity | null = null;

  const ensure = (id: string): ErEntity => {
    const existing = entities.get(id);
    if (existing !== undefined) {
      return existing;
    }
    const ent: ErEntity = { id, label: id, attrs: [] };
    entities.set(id, ent);
    return ent;
  };

  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('%%') || eqIgnoreCase(line, 'erDiagram')) {
      continue;
    }
    if (current !== null) {
      if (line === '}') {
        current = null;
        continue;
      }
      current.attrs.push(line);
      continue;
    }

    const idTok = takeId(line, 0);
    if (idTok === null) {
      diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      continue;
    }

    let i = skipWs(line, idTok.next);
    if (line[i] === '{') {
      current = ensure(idTok.value);
      continue;
    }

    const afterCard = skipCardinality(line, idTok.next);
    if (afterCard !== null) {
      const to = takeId(line, afterCard);
      if (to !== null) {
        ensure(idTok.value);
        ensure(to.value);
        let j = skipWs(line, to.next);
        let label: string | undefined;
        if (line[j] === ':') {
          label = restTrim(line, j + 1).trim();
        }
        relations.push({ from: idTok.value, to: to.value, label });
        continue;
      }
    }

    if (restTrim(line, idTok.next) === '') {
      ensure(idTok.value);
      continue;
    }

    diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
  }

  return {
    ir: { type: 'er', entities: [...entities.values()], relations },
    diagnostics,
  };
}
