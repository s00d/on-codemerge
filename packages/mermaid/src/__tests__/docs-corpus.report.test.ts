import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectDiagramType, parse, render } from '../index';

const corpusDir = join(import.meta.dirname, 'fixtures/docs-corpus');

type Row = {
  file: string;
  page: string;
  detected: string | null;
  status: 'ok' | 'warn' | 'error' | 'unsupported-header';
  warnings: number;
  errors: number;
  message?: string;
  svgLen?: number;
  hasSvg?: boolean;
  hasLifeline?: boolean;
  hasBottomActor?: boolean;
};

function loadCorpus(): Array<{ file: string; page: string; source: string }> {
  const index = JSON.parse(readFileSync(join(corpusDir, 'index.json'), 'utf8')) as Array<{
    file: string;
    page: string;
  }>;
  return index.map((row) => ({
    ...row,
    source: readFileSync(join(corpusDir, row.file), 'utf8'),
  }));
}

describe('docs-corpus report (official mermaid docs)', () => {
  it('runs all fixtures and writes report; never crashes; ok rate tracked', () => {
    const fixtures = loadCorpus();
    expect(fixtures.length).toBeGreaterThan(200);

    const rows: Row[] = [];
    for (const fx of fixtures) {
      const detected = detectDiagramType(fx.source);
      if (detected === null) {
        rows.push({
          file: fx.file,
          page: fx.page,
          detected: null,
          status: 'unsupported-header',
          warnings: 0,
          errors: 0,
          message: 'detect=null',
        });
        continue;
      }
      try {
        const parsed = parse(fx.source);
        const warnings = parsed.diagnostics.filter((d) => d.severity === 'warning').length;
        const errors = parsed.diagnostics.filter((d) => d.severity === 'error').length;
        if (parsed.ir === null || errors > 0) {
          rows.push({
            file: fx.file,
            page: fx.page,
            detected,
            status: 'error',
            warnings,
            errors,
            message: parsed.diagnostics
              .map((d) => d.message)
              .join('; ')
              .slice(0, 240),
          });
          continue;
        }
        const svg = render(fx.source);
        rows.push({
          file: fx.file,
          page: fx.page,
          detected,
          status: warnings > 0 ? 'warn' : 'ok',
          warnings,
          errors,
          svgLen: svg.length,
          hasSvg: svg.includes('<svg') && svg.includes('data-ocm-mermaid="1"'),
          hasLifeline: svg.includes('data-ocm-lifeline="1"'),
          hasBottomActor: svg.includes('data-ocm-seq-actor="bottom"'),
        });
      } catch (err) {
        rows.push({
          file: fx.file,
          page: fx.page,
          detected,
          status: 'error',
          warnings: 0,
          errors: 1,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const reportPath = join('/tmp', 'ocm-mermaid-docs-corpus-report.json');
    writeFileSync(reportPath, JSON.stringify(rows, null, 2));

    const ok = rows.filter((r) => r.status === 'ok').length;
    const warn = rows.filter((r) => r.status === 'warn').length;
    const err = rows.filter((r) => r.status === 'error').length;
    const unsup = rows.filter((r) => r.status === 'unsupported-header').length;

    // Soft gate: every fixture must produce a classified row; crashes already caught.
    expect(rows).toHaveLength(fixtures.length);
    // Hard gate: render path must never throw (error rows are parse/detect failures only).
    const thrown = rows.filter((r) => r.status === 'error' && (r.message ?? '').includes('throw'));
    expect(thrown).toStrictEqual([]);

    // Sequence with rendered SVG must close lifelines (top+bottom actors).
    const seqRendered = rows.filter(
      (r) =>
        r.detected === 'sequence' &&
        (r.status === 'ok' || r.status === 'warn') &&
        r.hasSvg === true &&
        (r.svgLen ?? 0) > 900
    );
    for (const r of seqRendered) {
      expect({ file: r.file, hasLifeline: r.hasLifeline }).toStrictEqual({
        file: r.file,
        hasLifeline: true,
      });
      expect({ file: r.file, hasBottomActor: r.hasBottomActor }).toStrictEqual({
        file: r.file,
        hasBottomActor: true,
      });
    }

    // Hard baseline from official docs corpus (266 fixtures): zero crashes/errors.
    expect(ok + warn).toBe(fixtures.length);
    expect(err).toBe(0);
    expect(unsup).toBe(0);
    expect(ok).toBeGreaterThan(170);

    // eslint-disable-next-line no-console
    console.log(
      `docs-corpus: total=${rows.length} ok=${ok} warn=${warn} error=${err} unsupported=${unsup} report=${reportPath}`
    );
  });

  it('corpus directory has index and mmd files', () => {
    const files = readdirSync(corpusDir).filter((f) => f.endsWith('.mmd'));
    expect(files.length).toBeGreaterThan(200);
  });
});
