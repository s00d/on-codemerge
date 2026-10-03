import { eqIgnoreCase, forEachLine, startsWithWord } from './scan';
import type { DiagramType } from './types';

function detectLine(line: string): DiagramType | null {
  if (eqIgnoreCase(line, 'sequenceDiagram')) {
    return 'sequence';
  }
  if (eqIgnoreCase(line, 'classDiagram')) {
    return 'class';
  }
  if (eqIgnoreCase(line, 'erDiagram')) {
    return 'er';
  }
  if (eqIgnoreCase(line, 'stateDiagram') || eqIgnoreCase(line, 'stateDiagram-v2')) {
    return 'state';
  }
  if (eqIgnoreCase(line, 'gantt')) {
    return 'gantt';
  }
  if (eqIgnoreCase(line, 'mindmap')) {
    return 'mindmap';
  }
  if (startsWithWord(line, 'pie')) {
    return 'pie';
  }
  if (startsWithWord(line, 'xychart') || startsWithWord(line, 'xychart-beta')) {
    return 'xychart';
  }
  if (startsWithWord(line, 'radar') || startsWithWord(line, 'radar-beta')) {
    return 'radar';
  }
  if (startsWithWord(line, 'flowchart') || startsWithWord(line, 'graph')) {
    return 'flowchart';
  }
  return null;
}

/**
 * First non-empty, non-`%%` logical line decides the type (Mermaid-compatible).
 * `;` is a line break (flowchart one-liners). Unknown first line → null (no scan-ahead).
 */
export function detectDiagramType(source: string): DiagramType | null {
  let decided: DiagramType | null | undefined;
  forEachLine(
    source,
    (line) => {
      if (decided !== undefined || line.startsWith('%%')) {
        return;
      }
      decided = detectLine(line);
    },
    { semicolon: true }
  );
  return decided ?? null;
}
