import { describe, expect, it } from 'vitest';
import { detectDiagramType } from '../detect';

describe('detectDiagramType', () => {
  it.each([
    ['flowchart LR\n  A-->B', 'flowchart'],
    ['flowchart\n  A-->B', 'flowchart'],
    ['graph TB\n  A-->B', 'flowchart'],
    ['sequenceDiagram\n  A->>B: x', 'sequence'],
    ['classDiagram\n  class A', 'class'],
    ['erDiagram\n  A ||--|| B : r', 'er'],
    ['stateDiagram\n  [*] --> A', 'state'],
    ['stateDiagram-v2\n  [*] --> A', 'state'],
    ['pie\n  "A" : 1', 'pie'],
    ['pie title T\n  "A" : 1', 'pie'],
    ['gantt\n  title T', 'gantt'],
    ['mindmap\n  root', 'mindmap'],
    ['xychart-beta\n  bar [1,2]', 'xychart'],
    ['radar-beta\n  axis a, b, c', 'radar'],
    ['pie showData donut\n  "A" : 1', 'pie'],
  ] as const)('detects %s', (source, type) => {
    expect(detectDiagramType(source)).toBe(type);
  });

  it('rejects unknown and empty', () => {
    expect(detectDiagramType('gitGraph\n  commit')).toBeNull();
    expect(detectDiagramType('')).toBeNull();
    expect(detectDiagramType('%% only comment')).toBeNull();
  });

  it('uses first substantive line only (no scan-ahead)', () => {
    expect(detectDiagramType('Introduction\nflowchart LR\n  A-->B')).toBeNull();
    expect(detectDiagramType('%% init\nflowchart LR\n  A-->B')).toBe('flowchart');
    expect(detectDiagramType('flowchart LR; A-->B')).toBe('flowchart');
  });
});
