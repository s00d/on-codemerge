import type { ChartSeries, ChartType } from '../types';
import type { ChartOptions } from '../types/ChartOptions';

const MERMAID_TYPES = new Set<ChartType>(['bar', 'line', 'area', 'pie', 'doughnut', 'radar']);

export function isMermaidChartType(type: ChartType): boolean {
  return MERMAID_TYPES.has(type);
}

function q(s: string): string {
  return `"${s.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function categoriesFrom(series: ChartSeries[]): string[] {
  const labels = new Set<string>();
  for (const s of series) {
    for (const p of s.data) {
      if (p.label.trim() !== '') {
        labels.add(p.label);
      }
    }
  }
  return [...labels];
}

function valuesFor(
  series: ChartSeries,
  cats: string[],
  stacked: boolean,
  prev?: number[]
): number[] {
  return cats.map((label, i) => {
    const pt = series.data.find((p) => p.label === label);
    const v = pt?.value ?? 0;
    if (stacked && prev !== undefined) {
      return (prev[i] ?? 0) + v;
    }
    return v;
  });
}

function xyChartSource(
  type: 'bar' | 'line' | 'area',
  series: ChartSeries[],
  options: ChartOptions
): string {
  const cats = categoriesFrom(series);
  const kind = type;
  let max = 0;
  const mode = options.mode ?? 'default';
  const lines: string[] = ['xychart-beta'];
  if (options.title !== undefined && options.title !== '') {
    lines.push(`  title ${q(options.title)}`);
  }
  lines.push(`  x-axis [${cats.map(q).join(', ')}]`);

  const seriesBlocks: string[] = [];
  let running: number[] | undefined;
  for (const s of series) {
    const vals =
      mode === 'stacked' && kind === 'bar'
        ? valuesFor(s, cats, true, running)
        : valuesFor(s, cats, false);
    if (mode === 'stacked' && kind === 'bar') {
      running = vals;
    }
    for (const v of vals) {
      max = Math.max(max, v);
    }
    const name = s.name.trim() !== '' ? ` ${q(s.name)}` : '';
    seriesBlocks.push(`  ${kind}${name} [${vals.join(', ')}]`);
  }
  if (max <= 0) {
    max = 1;
  }
  const yTitle = options.yAxis?.title;
  if (yTitle !== undefined && yTitle !== '') {
    lines.push(`  y-axis ${q(yTitle)} 0 --> ${max}`);
  } else {
    lines.push(`  y-axis 0 --> ${max}`);
  }
  lines.push(...seriesBlocks);
  return `${lines.join('\n')}\n`;
}

function pieSource(donut: boolean, series: ChartSeries[], options: ChartOptions): string {
  const data = series[0]?.data ?? [];
  const header = donut ? 'pie showData donut' : 'pie showData';
  const lines: string[] = [header];
  if (options.title !== undefined && options.title !== '') {
    lines.push(`  title ${options.title}`);
  }
  for (const p of data) {
    lines.push(`  ${q(p.label)} : ${p.value}`);
  }
  return `${lines.join('\n')}\n`;
}

function radarSource(series: ChartSeries[], options: ChartOptions): string {
  const cats = categoriesFrom(series);
  const lines: string[] = ['radar-beta'];
  if (options.title !== undefined && options.title !== '') {
    lines.push(`  title ${options.title}`);
  }
  if (cats.length > 0) {
    lines.push(`  axis ${cats.map((c, i) => `a${i}[${q(c)}]`).join(', ')}`);
  }
  let max = 0;
  for (const s of series) {
    const vals = valuesFor(s, cats, false);
    for (const v of vals) {
      max = Math.max(max, v);
    }
    const id = `s${series.indexOf(s)}`;
    const name = s.name.trim() !== '' ? `[${q(s.name)}]` : '';
    lines.push(`  curve ${id}${name}{${vals.join(', ')}}`);
  }
  if (max > 0) {
    lines.push(`  max ${max}`);
  }
  return `${lines.join('\n')}\n`;
}

/** Serialize chart SoT into mermaid-subset source for `@codemerge/mermaid` `render`. */
export function toMermaidSource(
  type: ChartType,
  series: ChartSeries[],
  options: ChartOptions
): string {
  switch (type) {
    case 'bar':
    case 'line':
    case 'area':
      return xyChartSource(type, series, options);
    case 'pie':
      return pieSource(false, series, options);
    case 'doughnut':
      return pieSource(true, series, options);
    case 'radar':
      return radarSource(series, options);
    case 'scatter':
    case 'bubble':
      throw new Error(`Chart type ${type} is not mermaid-backed`);
    default: {
      const _exhaustive: never = type;
      throw new Error(`Chart type ${String(_exhaustive)} is not mermaid-backed`);
    }
  }
}
