import {
  eqIgnoreCase,
  restTrim,
  skipWs,
  startsWithWord,
  stripOuterQuotes,
  takeNumber,
  takeQuoted,
} from '../scan';
import type { ParseDiagnostic, XyChartIR, XySeries, XySeriesKind } from '../types';

function parseBracketList(line: string, start: number): { items: string[]; next: number } | null {
  const i = skipWs(line, start);
  if (line[i] !== '[') {
    return null;
  }
  const end = line.indexOf(']', i + 1);
  if (end === -1) {
    return null;
  }
  const inner = line.slice(i + 1, end);
  const items: string[] = [];
  let buf = '';
  let inQ = false;
  for (const ch of inner) {
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      items.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim() !== '' || items.length > 0) {
    items.push(buf.trim());
  }
  return { items: items.filter((x) => x !== ''), next: end + 1 };
}

function parseNumberList(line: string, start: number): { values: number[]; next: number } | null {
  const list = parseBracketList(line, start);
  if (list === null) {
    return null;
  }
  const values: number[] = [];
  for (const item of list.items) {
    const n = Number(item);
    if (Number.isNaN(n)) {
      return null;
    }
    values.push(n);
  }
  return { values, next: list.next };
}

function parseSeriesLine(line: string, kind: XySeriesKind): { series: XySeries } | null {
  let i = kind.length;
  i = skipWs(line, i);
  let name: string | undefined;
  const q = takeQuoted(line, i);
  if (q !== null) {
    name = q.value;
    i = skipWs(line, q.next);
  }
  const nums = parseNumberList(line, i);
  if (nums === null) {
    return null;
  }
  return { series: { kind, name, values: nums.values } };
}

export function parseXyChart(source: string): { ir: XyChartIR; diagnostics: ParseDiagnostic[] } {
  const diagnostics: ParseDiagnostic[] = [];
  let title: string | undefined;
  let categories: string[] = [];
  let yMin = 0;
  let yMax = 0;
  let yLabel: string | undefined;
  let yMaxSet = false;
  const series: XySeries[] = [];

  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (
      line === '' ||
      line.startsWith('%%') ||
      eqIgnoreCase(line, 'xychart') ||
      eqIgnoreCase(line, 'xychart-beta')
    ) {
      continue;
    }
    if (startsWithWord(line, 'title')) {
      const rest = restTrim(line, 5).trim();
      const q = takeQuoted(rest, 0);
      title = q !== null ? q.value : stripOuterQuotes(rest);
      continue;
    }
    if (startsWithWord(line, 'x-axis')) {
      const list = parseBracketList(line, 'x-axis'.length);
      if (list !== null) {
        categories = list.items.map((s) => stripOuterQuotes(s));
        continue;
      }
      diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
      continue;
    }
    if (startsWithWord(line, 'y-axis')) {
      let i = 'y-axis'.length;
      i = skipWs(line, i);
      const q = takeQuoted(line, i);
      if (q !== null) {
        yLabel = q.value;
        i = skipWs(line, q.next);
      }
      const minTok = takeNumber(line, i);
      if (minTok !== null) {
        yMin = minTok.value;
        i = skipWs(line, minTok.next);
        if (line.startsWith('-->', i)) {
          i = skipWs(line, i + 3);
          const maxTok = takeNumber(line, i);
          if (maxTok !== null) {
            yMax = maxTok.value;
            yMaxSet = true;
          }
        }
      }
      continue;
    }
    for (const kind of ['bar', 'line', 'area'] as const) {
      if (startsWithWord(line, kind)) {
        const parsed = parseSeriesLine(line, kind);
        if (parsed !== null) {
          series.push(parsed.series);
        } else {
          diagnostics.push({ severity: 'warning', message: `Skipping unrecognized line: ${line}` });
        }
        break;
      }
    }
  }

  if (!yMaxSet) {
    let maxV = 0;
    for (const s of series) {
      for (const v of s.values) {
        maxV = Math.max(maxV, v);
      }
    }
    yMax = maxV === 0 ? 1 : maxV;
  }
  if (categories.length === 0 && series[0] !== undefined) {
    categories = series[0].values.map((_, i) => String(i + 1));
  }

  return {
    ir: { type: 'xychart', title, categories, yMin, yMax, yLabel, series },
    diagnostics,
  };
}
