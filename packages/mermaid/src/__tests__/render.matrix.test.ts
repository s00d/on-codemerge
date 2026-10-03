import { describe, expect, it } from 'vitest';
import { detectDiagramType, parse, render } from '../index';

const FIXTURES: Array<{ name: string; source: string; expectText: RegExp; minPaths: number }> = [
  {
    name: 'flowchart',
    source: 'flowchart LR\n  A[Source]-->B[Sink]',
    expectText: /Source|Sink/,
    minPaths: 1,
  },
  {
    name: 'sequence',
    source: 'sequenceDiagram\n  Alice->>Bob: hello',
    expectText: /Alice|Bob|hello/,
    minPaths: 1,
  },
  {
    name: 'class',
    source: 'classDiagram\n  class Animal',
    expectText: /Animal/,
    minPaths: 0,
  },
  {
    name: 'er',
    source: 'erDiagram\n  CUSTOMER ||--o{ ORDER : places',
    expectText: /CUSTOMER|ORDER/,
    minPaths: 1,
  },
  {
    name: 'state',
    source: 'stateDiagram-v2\n  [*] --> Still\n  Still --> [*]',
    expectText: /Still/,
    minPaths: 1,
  },
  {
    name: 'pie',
    source: 'pie title Pets\n  "Dogs" : 386\n  "Cats" : 85',
    expectText: /Pets|Dogs|Cats/,
    minPaths: 2,
  },
  {
    name: 'gantt',
    source: 'gantt\n  title Plan\n  section S\n  Build :a1, 2024-01-01, 30d',
    expectText: /Plan|Build/,
    minPaths: 0,
  },
  {
    name: 'mindmap',
    source: 'mindmap\n  root((idea))\n    branch',
    expectText: /idea|branch/,
    minPaths: 1,
  },
  {
    name: 'xychart',
    source:
      'xychart-beta\n  title "Sales"\n  x-axis [a, b, c]\n  y-axis 0 --> 10\n  bar [3, 5, 8]\n  line [2, 4, 7]',
    expectText: /Sales|a|b|c/,
    minPaths: 1,
  },
  {
    name: 'radar',
    source: 'radar-beta\n  title Skills\n  axis a, b, c, d\n  curve s1{2, 4, 3, 5}',
    expectText: /Skills|a|b/,
    minPaths: 0,
  },
];

describe('render matrix', () => {
  for (const fx of FIXTURES) {
    it(`renders ${fx.name} with structure`, () => {
      expect(detectDiagramType(fx.source)).toBe(fx.name);
      const parsed = parse(fx.source);
      expect(parsed.ir).not.toBeNull();
      expect(parsed.diagnostics.some((d) => d.severity === 'error')).toBe(false);
      const svg = render(fx.source);
      expect(svg).toContain('<svg');
      expect(svg).not.toContain('<style');
      expect(svg).toMatch(fx.expectText);
      const pathCount = (svg.match(/<path /g) ?? []).length;
      expect(pathCount).toBeGreaterThanOrEqual(fx.minPaths);
      expect(svg).toMatch(/<text |<rect |<circle |<path /);
    });
  }
});
