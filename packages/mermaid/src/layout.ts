import { layoutLayered } from './layout/layered';
import { layoutRadar } from './layout/radarChart';
import { layoutMindmap, layoutPie } from './layout/radial';
import { layoutSequence } from './layout/sequence';
import { layoutGantt } from './layout/timeline';
import { layoutXyChart } from './layout/xy';
import type { DiagramIR, FlowNode, LayoutOptions, PositionedGraph } from './types';

export function layout(ir: DiagramIR, options: LayoutOptions = {}): PositionedGraph {
  switch (ir.type) {
    case 'flowchart':
      return layoutLayered(
        'flowchart',
        ir.nodes,
        ir.edges,
        options.direction ?? ir.direction,
        options
      );
    case 'state':
      return layoutLayered('state', ir.nodes, ir.edges, options.direction ?? ir.direction, options);
    case 'sequence':
      return layoutSequence(ir, options);
    case 'class': {
      const nodes: FlowNode[] = ir.classes.map((c) => ({
        id: c.id,
        label: [c.label, ...c.members.map((m) => m.name)].join('\n'),
        shape: 'rect' as const,
      }));
      const edges = ir.relations.map((r) => ({
        from: r.from,
        to: r.to,
        label: r.label,
      }));
      return layoutLayered('class', nodes, edges, options.direction ?? 'TB', options);
    }
    case 'er': {
      const nodes: FlowNode[] = ir.entities.map((e) => ({
        id: e.id,
        label: [e.label, ...e.attrs].join('\n'),
        shape: 'rect' as const,
      }));
      const edges = ir.relations.map((r) => ({
        from: r.from,
        to: r.to,
        label: r.label,
      }));
      return layoutLayered('er', nodes, edges, options.direction ?? 'LR', options);
    }
    case 'pie':
      return layoutPie(ir, options);
    case 'gantt':
      return layoutGantt(ir, options);
    case 'mindmap':
      return layoutMindmap(ir, options);
    case 'xychart':
      return layoutXyChart(ir, options);
    case 'radar':
      return layoutRadar(ir, options);
    default: {
      const _exhaustive: never = ir;
      throw new Error(`Unsupported diagram IR: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
