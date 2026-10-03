import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTOR_SWATCHES, DEFAULTS, NOTE_SWATCH, parse, render } from '../index';

const fixtures = join(import.meta.dirname, 'fixtures');

function load(name: string): string {
  return readFileSync(join(fixtures, name), 'utf8');
}

describe('docs flowchart LR shapes parity', () => {
  it('parses Square/Circle/Round/Rhombus with Link text edge', () => {
    const src = load('docs-flowchart-lr-shapes.mmd');
    const r = parse(src);
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    expect(r.ir.nodes).toHaveLength(4);
    expect(r.ir.nodes.find((n) => n.id === 'B')?.shape).toBe('circle');
    expect(r.ir.nodes.find((n) => n.id === 'B')?.label).toBe('Circle');
    expect(r.ir.nodes.find((n) => n.id === 'A')?.shape).toBe('rect');
    expect(r.ir.nodes.find((n) => n.id === 'C')?.shape).toBe('rounded');
    expect(r.ir.nodes.find((n) => n.id === 'D')?.shape).toBe('diamond');
    const ab = r.ir.edges.find((e) => e.from === 'A' && e.to === 'B');
    expect(ab?.label).toBe('Link text');
    expect(r.ir.edges).toHaveLength(4);

    const svg = render(src);
    expect(svg).toContain('<circle');
    expect(svg).toContain('<polygon');
    expect(svg).toContain('Link text');
    expect(svg).toContain('data-ocm-edge-label="1"');
    expect(svg).toContain(`fill="${DEFAULTS.surface}"`);
    expect(svg).toContain(`stroke="${DEFAULTS.accent}"`);
    // Sharp square rect (rx=0) present
    expect(svg).toMatch(/<rect[^>]+rx="0"/);
  });
});

describe('docs flowchart TB complex parity', () => {
  it('skips subgraph/classDef, parses odd/br/==>, later e is circle', () => {
    const src = load('docs-flowchart-tb-complex.mmd');
    const r = parse(src);
    expect(r.ir?.type).toBe('flowchart');
    if (r.ir?.type !== 'flowchart') {
      return;
    }
    const ids = r.ir.nodes.map((n) => n.id);
    expect(ids).not.toContain('subgraph');
    expect(ids).not.toContain('end');
    expect(ids).not.toContain('classDef');
    expect(ids).not.toContain('class');

    expect(r.ir.nodes.find((n) => n.id === 'od')?.shape).toBe('odd');
    expect(r.ir.nodes.find((n) => n.id === 'od')?.label).toBe('Odd shape');
    expect(r.ir.nodes.find((n) => n.id === 'e')?.shape).toBe('circle');
    expect(r.ir.nodes.find((n) => n.id === 'di')?.label).toContain('\n');
    expect(r.ir.nodes.find((n) => n.id === 'di')?.label).not.toContain('<br');

    const odRo = r.ir.edges.find((e) => e.from === 'od' && e.to === 'ro');
    expect(odRo?.label).toBe('Two line\nedge comment');
    const thick = r.ir.edges.find((e) => e.from === 'di' && e.to === 'ro2');
    expect(thick?.thick).toBe(true);
    const dashed = r.ir.edges.find((e) => e.from === 'di' && e.to === 'ro');
    expect(dashed?.dashed).toBe(true);

    const svg = render(src);
    expect(svg).toContain('data-ocm-shape="odd"');
    expect(svg).toContain('Начало');
    expect(svg).toContain('Odd shape');
    expect(svg).toContain('stroke-width="2.5"');
    expect(svg).not.toContain('&lt;br');
  });
});

describe('OCM theme + sequence actor colors', () => {
  it('DEFAULTS use OCM sky accent', () => {
    expect(DEFAULTS.accent).toBe('#0284c7');
    expect(DEFAULTS.border).toBe('#e4e4e7');
    expect(DEFAULTS.surface).toBe('#f0f9ff');
  });

  it('sequence actors use distinct ACTOR_SWATCHES; note uses NOTE_SWATCH', () => {
    const src = `sequenceDiagram
    Alice ->> Bob: hi
    Bob-->>John: yo
    Note right of John: think<br/>long
`;
    const svg = render(src);
    expect(svg).toContain(`fill="${ACTOR_SWATCHES[0]?.fill}"`);
    expect(svg).toContain(`fill="${ACTOR_SWATCHES[1]?.fill}"`);
    expect(svg).toContain(`fill="${ACTOR_SWATCHES[2]?.fill}"`);
    expect(svg).toContain(`fill="${NOTE_SWATCH.fill}"`);
    expect(svg).toContain(`stroke="${NOTE_SWATCH.stroke}"`);
    expect(svg).toContain(`fill="${DEFAULTS.accent}"`); // arrow marker
  });
});
