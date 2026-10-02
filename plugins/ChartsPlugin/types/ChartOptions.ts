export interface ChartAxisOptions {
  show?: boolean;
  title?: string;
  min?: number;
  max?: number;
}

export interface ChartLegendOptions {
  show?: boolean;
}

export interface ChartGridOptions {
  show?: boolean;
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
}

export interface ChartOptions {
  title?: string;
  width: number;
  height: number;
  padding?: number;
  xAxis?: ChartAxisOptions;
  yAxis?: ChartAxisOptions;
  legend?: ChartLegendOptions;
  grid?: ChartGridOptions;
  colors?: string[];
  mode?: 'default' | 'stacked' | 'grouped';
  orientation?: 'vertical' | 'horizontal';
}
