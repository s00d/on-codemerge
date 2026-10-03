import { eqIgnoreCase, restTrim, skipWs, startsWithWord, takeId } from '../scan';
import type { ClassBox, ClassIR, ClassRel, ParseDiagnostic } from '../types';

const REL_OPS = ['<|--', '|>--', '*--', 'o--', '..', '--'] as const;

function takeRelOp(line: string, i: number): { value: string; next: number } | null {
  i = skipWs(line, i);
  for (const op of REL_OPS) {
    if (line.startsWith(op, i)) {
      return { value: op, next: i + op.length };
    }
  }
  return null;
}

function stripMemberPrefix(name: string): string {
  const c = name[0];
  if (c === '+' || c === '-' || c === '#') {
    return name.slice(1).trim();
  }
  return name;
}

export function parseClassDiagram(source: string): { ir: ClassIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  const classes = new Map<string, ClassBox>();
  const relations: ClassRel[] = [];
  let current: ClassBox | null = null;

  const ensure = (id: string): ClassBox => {
    const existing = classes.get(id);
    if (existing !== undefined) {
      return existing;
    }
    const box: ClassBox = { id, label: id, members: [] };
    classes.set(id, box);
    return box;
  };

  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('%%') || eqIgnoreCase(line, 'classDiagram')) {
      continue;
    }
    if (current !== null) {
      if (line === '}') {
        current = null;
        continue;
      }
      const name = stripMemberPrefix(line);
      const kind = name.includes('(') ? 'method' : 'field';
      current.members.push({ name, kind });
      continue;
    }

    if (startsWithWord(line, 'class')) {
      const idTok = takeId(line, 'class'.length);
      if (idTok === null) {
        diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
        continue;
      }
      const box = ensure(idTok.value);
      const rest = restTrim(line, idTok.next);
      if (rest.startsWith('{')) {
        current = box;
      }
      continue;
    }

    const from = takeId(line, 0);
    if (from === null) {
      diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      continue;
    }
    const op = takeRelOp(line, from.next);
    if (op !== null) {
      const to = takeId(line, op.next);
      if (to !== null) {
        ensure(from.value);
        ensure(to.value);
        let j = skipWs(line, to.next);
        let label: string | undefined;
        if (line[j] === ':') {
          label = restTrim(line, j + 1).trim();
        }
        relations.push({ from: from.value, to: to.value, label });
        continue;
      }
    }

    diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
  }

  return {
    ir: { type: 'class', classes: [...classes.values()], relations },
    diagnostics,
  };
}
