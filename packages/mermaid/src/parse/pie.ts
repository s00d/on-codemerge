import {
  eqIgnoreCase,
  forEachLine,
  restTrim,
  skipWs,
  splitWs,
  startsWithWord,
  takeNumber,
  takeQuoted,
} from '../scan';
import type { ParseDiagnostic, PieIR, PieSlice } from '../types';

function parsePieHeader(line: string): { showData: boolean; donut: boolean } | null {
  if (!startsWithWord(line, 'pie')) {
    return null;
  }
  const rest = restTrim(line, 3).toLowerCase();
  const tokens = splitWs(rest);
  // "pie title …" is not a flags-only header
  if (tokens[0] === 'title') {
    return null;
  }
  let showData = false;
  let donut = false;
  for (const t of tokens) {
    if (t === 'showdata') {
      showData = true;
    } else if (t === 'donut') {
      donut = true;
    } else {
      return null;
    }
  }
  return { showData, donut };
}

export function parsePie(source: string): { ir: PieIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  const slices: PieSlice[] = [];
  let title: string | undefined;
  let showData = false;
  let hole = 0;

  forEachLine(source, (line) => {
    if (line.startsWith('%%')) {
      return;
    }
    const header = parsePieHeader(line);
    if (header !== null) {
      if (header.showData) {
        showData = true;
      }
      if (header.donut) {
        hole = 0.55;
      }
      return;
    }
    if (eqIgnoreCase(line, 'pie')) {
      return;
    }
    if (startsWithWord(line, 'pie') && startsWithWord(restTrim(line, 3), 'title')) {
      title = restTrim(line, line.toLowerCase().indexOf('title') + 5).trim();
      return;
    }
    if (startsWithWord(line, 'title')) {
      title = restTrim(line, 5).trim();
      return;
    }

    const q = takeQuoted(line, 0);
    if (q !== null) {
      let i = skipWs(line, q.next);
      if (line[i] === ':') {
        const num = takeNumber(line, i + 1);
        if (num !== null) {
          if (Number.isNaN(num.value) || num.value < 0) {
            diagnostics.push({
              severity: 'error',
              message: 'Slice value must be a non-negative number',
            });
            return;
          }
          slices.push({ label: q.value, value: num.value });
          return;
        }
      }
    }

    diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
  });

  return { ir: { type: 'pie', title, slices, showData, hole }, diagnostics };
}
