import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '../index';

const BENCH = process.env.MERMAID_BENCH === '1';
const fixtures = join(import.meta.dirname, 'fixtures');
const corpusDir = join(fixtures, 'docs-corpus');

function load(name: string): string {
  return readFileSync(join(fixtures, name), 'utf8');
}

function median(samples: number[]): number {
  const sorted = samples.toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

function measureRender(source: string, runs = 11): number {
  render(source); // warm
  render(source);
  const samples: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const t0 = performance.now();
    render(source);
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

const SEQ = `sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Note right of John: Bob thinks a long<br/>long time
`;

const PIE = `pie showData
    title Pets
    "Dogs" : 386
    "Cats" : 85
`;

const XY = `xychart-beta
    title "Sales"
    x-axis [jan, feb, mar]
    y-axis "Revenue" 0 --> 200
    bar [120, 90, 150]
`;

describe('@codemerge/mermaid render perf budgets', () => {
  it('flowchart LR shapes median under budget', () => {
    const ms = measureRender(load('docs-flowchart-lr-shapes.mmd'));
    if (BENCH) {
      // eslint-disable-next-line no-console -- bench report
      console.log(`[mermaid-perf] flowchart-lr median=${ms.toFixed(3)}ms`);
    }
    expect(ms).toBeLessThan(1.5);
  });

  it('flowchart TB complex median under budget', () => {
    const ms = measureRender(load('docs-flowchart-tb-complex.mmd'));
    if (BENCH) {
      // eslint-disable-next-line no-console -- bench report
      console.log(`[mermaid-perf] flowchart-tb median=${ms.toFixed(3)}ms`);
    }
    expect(ms).toBeLessThan(4);
  });

  it('sequence with notes median under budget', () => {
    const ms = measureRender(SEQ);
    if (BENCH) {
      // eslint-disable-next-line no-console -- bench report
      console.log(`[mermaid-perf] sequence median=${ms.toFixed(3)}ms`);
    }
    expect(ms).toBeLessThan(3);
  });

  it('pie + xychart median under budget', () => {
    const pieMs = measureRender(PIE);
    const xyMs = measureRender(XY);
    if (BENCH) {
      // eslint-disable-next-line no-console -- bench report
      console.log(`[mermaid-perf] pie=${pieMs.toFixed(3)}ms xy=${xyMs.toFixed(3)}ms`);
    }
    expect(pieMs).toBeLessThan(1.5);
    expect(xyMs).toBeLessThan(2);
  });

  it('docs-corpus 266× render wall under budget', () => {
    const files = readdirSync(corpusDir)
      .filter((f) => f.endsWith('.mmd'))
      .toSorted();
    expect(files.length).toBe(266);
    // warm first fixture
    const first = files[0];
    if (first !== undefined) {
      render(readFileSync(join(corpusDir, first), 'utf8'));
    }
    const t0 = performance.now();
    for (const f of files) {
      try {
        render(readFileSync(join(corpusDir, f), 'utf8'));
      } catch {
        // parse/detect failures still exercise path; ignore throw for wall clock
      }
    }
    const ms = performance.now() - t0;
    if (BENCH) {
      // eslint-disable-next-line no-console -- bench report
      console.log(`[mermaid-perf] corpus266 wall=${ms.toFixed(1)}ms`);
    }
    // CI runners vary; keep generous wall budget (local laptop typically << 100ms).
    expect(ms).toBeLessThan(300);
  });
});
