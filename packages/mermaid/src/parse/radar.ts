import {
  eqIgnoreCase,
  restTrim,
  skipWs,
  startsWithWord,
  stripOuterQuotes,
  takeId,
  takeNumber,
  takeQuoted,
} from '../scan';
import type { ParseDiagnostic, RadarCurve, RadarIR } from '../types';

function parseAxisLine(line: string): Array<{ id: string; label: string }> {
  let i = 'axis'.length;
  const out: Array<{ id: string; label: string }> = [];
  while (i < line.length) {
    i = skipWs(line, i);
    if (line[i] === ',') {
      i += 1;
      continue;
    }
    const idTok = takeId(line, i);
    if (idTok === null) {
      break;
    }
    i = idTok.next;
    let label = idTok.value;
    i = skipWs(line, i);
    if (line[i] === '[') {
      const end = line.indexOf(']', i + 1);
      if (end !== -1) {
        label = stripOuterQuotes(line.slice(i + 1, end));
        i = end + 1;
      }
    } else {
      const q = takeQuoted(line, i);
      if (q !== null) {
        label = q.value;
        i = q.next;
      }
    }
    out.push({ id: idTok.value, label });
  }
  return out;
}

function parseCurveLine(line: string): RadarCurve | null {
  let i = 'curve'.length;
  i = skipWs(line, i);
  const idTok = takeId(line, i);
  if (idTok === null) {
    return null;
  }
  i = skipWs(line, idTok.next);
  let name: string | undefined;
  if (line[i] === '[') {
    const end = line.indexOf(']', i + 1);
    if (end !== -1) {
      name = stripOuterQuotes(line.slice(i + 1, end));
      i = skipWs(line, end + 1);
    }
  } else {
    const q = takeQuoted(line, i);
    if (q !== null) {
      name = q.value;
      i = skipWs(line, q.next);
    }
  }
  if (line[i] !== '{') {
    return null;
  }
  const end = line.indexOf('}', i + 1);
  if (end === -1) {
    return null;
  }
  const inner = line.slice(i + 1, end);
  const values: number[] = [];
  for (const part of inner.split(',')) {
    const t = part.trim();
    if (t.includes(':')) {
      const rhs = t.split(':')[1]?.trim() ?? '';
      const n = Number(rhs);
      if (!Number.isNaN(n)) {
        values.push(n);
      }
      continue;
    }
    const n = Number(t);
    if (!Number.isNaN(n)) {
      values.push(n);
    }
  }
  return { id: idTok.value, name, values };
}

export function parseRadar(source: string): { ir: RadarIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  let title: string | undefined;
  const axes: Array<{ id: string; label: string }> = [];
  const curves: RadarCurve[] = [];
  let min = 0;
  let max = 0;
  let maxSet = false;
  let ticks = 5;
  let showLegend = true;

  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (
      line === '' ||
      line.startsWith('%%') ||
      eqIgnoreCase(line, 'radar') ||
      eqIgnoreCase(line, 'radar-beta')
    ) {
      continue;
    }
    if (startsWithWord(line, 'title')) {
      title = stripOuterQuotes(restTrim(line, 5).trim());
      continue;
    }
    if (startsWithWord(line, 'axis')) {
      axes.push(...parseAxisLine(line));
      continue;
    }
    if (startsWithWord(line, 'curve')) {
      const c = parseCurveLine(line);
      if (c !== null) {
        curves.push(c);
      } else {
        diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      }
      continue;
    }
    if (startsWithWord(line, 'min')) {
      const n = takeNumber(line, 3);
      if (n !== null) {
        min = n.value;
      }
      continue;
    }
    if (startsWithWord(line, 'max')) {
      const n = takeNumber(line, 3);
      if (n !== null) {
        max = n.value;
        maxSet = true;
      }
      continue;
    }
    if (startsWithWord(line, 'ticks')) {
      const n = takeNumber(line, 5);
      if (n !== null) {
        ticks = Math.max(1, Math.trunc(n.value));
      }
      continue;
    }
    if (startsWithWord(line, 'showLegend')) {
      const rest = restTrim(line, 'showLegend'.length).trim().toLowerCase();
      showLegend = rest !== 'false';
      continue;
    }
    diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
  }

  if (!maxSet) {
    let m = 0;
    for (const c of curves) {
      for (const v of c.values) {
        m = Math.max(m, v);
      }
    }
    max = m === 0 ? 1 : m;
  }

  return {
    ir: { type: 'radar', title, axes, curves, min, max, ticks, showLegend },
    diagnostics,
  };
}
