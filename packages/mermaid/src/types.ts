export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'er'
  | 'state'
  | 'pie'
  | 'gantt'
  | 'mindmap'
  | 'xychart'
  | 'radar';

export type Direction = 'TB' | 'TD' | 'BT' | 'LR' | 'RL';

export type NodeShape =
  | 'rect'
  | 'rounded'
  | 'diamond'
  | 'circle'
  | 'stadium'
  | 'cyl'
  | 'odd'
  | 'start'
  | 'end';

export interface FlowNode {
  id: string;
  label: string;
  shape: NodeShape;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  thick?: boolean;
}

export interface FlowchartIR {
  type: 'flowchart';
  direction: Direction;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface SequenceParticipant {
  id: string;
  label: string;
}

/** Sequence message arrow head / stroke style (mermaid subset). */
export type SequenceArrow =
  | 'solid-arrow'
  | 'dotted-arrow'
  | 'solid-open'
  | 'dotted-open'
  | 'solid-cross'
  | 'dotted-cross';

export interface SequenceMessage {
  from: string;
  to: string;
  label: string;
  arrow: SequenceArrow;
  /** True when stroke is dashed (dotted-* arrows). */
  dashed?: boolean;
}

export interface SequenceNote {
  participant: string;
  label: string;
  side: 'left' | 'right';
}

export type SequenceItem =
  | ({ kind: 'message' } & SequenceMessage)
  | ({ kind: 'note' } & SequenceNote);

export interface SequenceIR {
  type: 'sequence';
  participants: SequenceParticipant[];
  /** Source order: messages and notes interleaved. */
  items: SequenceItem[];
}

export interface ClassMember {
  name: string;
  kind: 'field' | 'method';
}

export interface ClassBox {
  id: string;
  label: string;
  members: ClassMember[];
}

export interface ClassRel {
  from: string;
  to: string;
  label?: string;
}

export interface ClassIR {
  type: 'class';
  classes: ClassBox[];
  relations: ClassRel[];
}

export interface ErEntity {
  id: string;
  label: string;
  attrs: string[];
}

export interface ErRel {
  from: string;
  to: string;
  label?: string;
}

export interface ErIR {
  type: 'er';
  entities: ErEntity[];
  relations: ErRel[];
}

export interface StateIR {
  type: 'state';
  direction: Direction;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface PieSlice {
  label: string;
  value: number;
}

export interface PieIR {
  type: 'pie';
  title?: string;
  slices: PieSlice[];
  showData?: boolean;
  /** 0 = full pie; ~0.55 = donut hole ratio of outer radius. */
  hole?: number;
}

export type XySeriesKind = 'bar' | 'line' | 'area';

export interface XySeries {
  kind: XySeriesKind;
  name?: string;
  values: number[];
}

export interface XyChartIR {
  type: 'xychart';
  title?: string;
  categories: string[];
  yMin: number;
  yMax: number;
  yLabel?: string;
  series: XySeries[];
}

export interface RadarCurve {
  id: string;
  name?: string;
  values: number[];
}

export interface RadarIR {
  type: 'radar';
  title?: string;
  axes: Array<{ id: string; label: string }>;
  curves: RadarCurve[];
  min: number;
  max: number;
  ticks: number;
  showLegend: boolean;
}

export interface GanttTask {
  id: string;
  label: string;
  start: number;
  end: number;
  section: string;
}

export interface GanttIR {
  type: 'gantt';
  title?: string;
  tasks: GanttTask[];
}

export interface MindNode {
  id: string;
  label: string;
  children: MindNode[];
}

export interface MindmapIR {
  type: 'mindmap';
  root: MindNode;
}

export type DiagramIR =
  | FlowchartIR
  | SequenceIR
  | ClassIR
  | ErIR
  | StateIR
  | PieIR
  | GanttIR
  | MindmapIR
  | XyChartIR
  | RadarIR;

export interface ParseDiagnostic {
  severity: 'error' | 'warning';
  message: string;
}

export interface ParseResult {
  ir: DiagramIR | null;
  diagnostics: ParseDiagnostic[];
}

export interface Point {
  x: number;
  y: number;
}

export interface PositionedNode {
  id: string;
  label: string;
  shape: NodeShape;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SequenceEndMarker = 'arrow' | 'open' | 'cross';

export interface PositionedEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  thick?: boolean;
  end?: SequenceEndMarker;
  points: Point[];
}

export interface PositionedLifeline {
  x: number;
  y1: number;
  y2: number;
}

export interface PositionedSequenceNote {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface PositionedSequenceMessage {
  x1: number;
  x2: number;
  y: number;
  label: string;
  dashed: boolean;
  end: SequenceEndMarker;
}

export interface PositionedPieSlice {
  start: number;
  sweep: number;
  label: string;
  value: number;
}

export interface PositionedPie {
  cx: number;
  cy: number;
  r: number;
  hole: number;
  showData: boolean;
  slices: PositionedPieSlice[];
}

export interface PositionedXySeries {
  kind: XySeriesKind;
  name?: string;
  values: number[];
}

export interface PositionedXy {
  plotX: number;
  plotY: number;
  plotW: number;
  plotH: number;
  categories: string[];
  yMin: number;
  yMax: number;
  yLabel?: string;
  series: PositionedXySeries[];
}

export interface PositionedRadar {
  cx: number;
  cy: number;
  r: number;
  axes: Array<{ id: string; label: string }>;
  curves: RadarCurve[];
  min: number;
  max: number;
  ticks: number;
  showLegend: boolean;
}

export interface PositionedGraph {
  width: number;
  height: number;
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  title?: string;
  kind: DiagramType;
  /** Typed pie geometry — never encode angles in node labels. */
  pie?: PositionedPie;
  xychart?: PositionedXy;
  radar?: PositionedRadar;
  lifelines?: PositionedLifeline[];
  sequenceMessages?: PositionedSequenceMessage[];
  sequenceNotes?: PositionedSequenceNote[];
  /** Bottom participant boxes (mirror of top `nodes` on sequence). */
  sequenceActorBottoms?: PositionedNode[];
}

export interface LayoutOptions {
  direction?: Direction;
  nodeSpacing?: number;
  layerSpacing?: number;
  padding?: number;
}

export interface RenderOptions {
  theme?: DiagramTheme;
  padding?: number;
  transparent?: boolean;
  /** Hex fills for series/slices; overrides theme-derived palette when non-empty. */
  palette?: string[];
}

export interface DiagramTheme {
  bg: string;
  fg: string;
  line?: string;
  accent?: string;
  surface?: string;
  border?: string;
}

export interface ResolvedTheme {
  bg: string;
  fg: string;
  line: string;
  accent: string;
  surface: string;
  border: string;
  font: string;
}
