import { detectDiagramType } from './detect';
import { parseClassDiagram } from './parse/classDiagram';
import { parseEr } from './parse/er';
import { parseFlowchart } from './parse/flowchart';
import { parseGantt } from './parse/gantt';
import { parseMindmap } from './parse/mindmap';
import { parsePie } from './parse/pie';
import { parseRadar } from './parse/radar';
import { parseSequence } from './parse/sequence';
import { parseXyChart } from './parse/xychart';
import type { ParseResult, StateIR } from './types';

export function parse(source: string): ParseResult {
  const type = detectDiagramType(source);
  if (type === null) {
    return {
      ir: null,
      diagnostics: [
        {
          severity: 'error',
          message:
            'Unable to detect diagram type. Expected flowchart/graph, sequenceDiagram, classDiagram, erDiagram, stateDiagram[-v2], pie, gantt, mindmap, xychart, or radar.',
        },
      ],
    };
  }

  switch (type) {
    case 'flowchart': {
      const r = parseFlowchart(source, false);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    case 'state': {
      const r = parseFlowchart(source, true);
      const ir: StateIR = {
        type: 'state',
        direction: r.ir.direction,
        nodes: r.ir.nodes,
        edges: r.ir.edges,
      };
      return { ir, diagnostics: r.diagnostics };
    }
    case 'sequence': {
      const r = parseSequence(source);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    case 'class': {
      const r = parseClassDiagram(source);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    case 'er': {
      const r = parseEr(source);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    case 'pie': {
      const r = parsePie(source);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    case 'gantt': {
      const r = parseGantt(source);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    case 'mindmap': {
      const r = parseMindmap(source);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    case 'xychart': {
      const r = parseXyChart(source);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    case 'radar': {
      const r = parseRadar(source);
      return { ir: r.ir, diagnostics: r.diagnostics };
    }
    default: {
      const _exhaustive: never = type;
      return {
        ir: null,
        diagnostics: [
          { severity: 'error', message: `Unsupported diagram type: ${String(_exhaustive)}` },
        ],
      };
    }
  }
}
