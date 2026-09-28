export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'radar'
  | 'scatter'
  | 'bubble';

export interface ChartPoint {
  label: string;
  value: number;
  x?: number;
  y?: number;
  r?: number; // For bubble chart radius
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartPoint[];
  color?: string;
}
