import {
  eqIgnoreCase,
  forEachLine,
  restTrim,
  skipWs,
  startsWithWord,
  takeId,
  takeIsoDate,
  takeNumber,
} from '../scan';
import type { GanttIR, GanttTask, ParseDiagnostic } from '../types';

/** Parse YYYY-MM-DD → day number (UTC). */
function parseIsoDay(s: string): number | null {
  if (s.length < 10 || s[4] !== '-' || s[7] !== '-') {
    return null;
  }
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(5, 7));
  const d = Number(s.slice(8, 10));
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
    return null;
  }
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function parseGantt(source: string): { ir: GanttIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  const tasks: GanttTask[] = [];
  let title: string | undefined;
  let section = 'default';
  let cursor = 0;
  let taskIndex = 0;
  let origin: number | null = null;

  forEachLine(source, (line) => {
    if (
      line.startsWith('%%') ||
      eqIgnoreCase(line, 'gantt') ||
      startsWithWord(line, 'dateFormat')
    ) {
      return;
    }
    if (startsWithWord(line, 'title')) {
      title = restTrim(line, 5).trim();
      return;
    }
    if (startsWithWord(line, 'section')) {
      section = restTrim(line, 7).trim() || 'default';
      return;
    }

    const colon = line.indexOf(':');
    if (colon === -1) {
      diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      return;
    }
    const label = line.slice(0, colon).trim();
    let timing = restTrim(line, colon + 1);
    let id = `t${taskIndex}`;
    const idTok = takeId(timing, 0);
    if (idTok !== null) {
      let i = skipWs(timing, idTok.next);
      if (timing[i] === ',') {
        id = idTok.value;
        timing = restTrim(timing, i + 1);
      }
    }

    // duration: trailing integer, optional `d`
    let dur = 1;
    let j = timing.length - 1;
    while (j >= 0 && (timing[j] === ' ' || timing[j] === 'd' || timing[j] === 'D')) {
      j -= 1;
    }
    const numStart = (() => {
      let k = j;
      while (k >= 0 && timing.charCodeAt(k) >= 48 && timing.charCodeAt(k) <= 57) {
        k -= 1;
      }
      return k + 1;
    })();
    if (numStart <= j) {
      const n = takeNumber(timing, numStart);
      if (n !== null) {
        dur = Math.max(1, Math.trunc(n.value));
      }
    }

    // optional ISO date before duration
    let start = cursor;
    const iso = takeIsoDate(timing, 0);
    if (iso !== null) {
      const day = parseIsoDay(iso.value);
      if (day !== null) {
        if (origin === null) {
          origin = day;
        }
        start = day - origin;
      }
    }

    const end = start + dur;
    cursor = Math.max(cursor, end);
    tasks.push({ id, label, start, end, section });
    taskIndex += 1;
  });

  return { ir: { type: 'gantt', title, tasks }, diagnostics };
}
