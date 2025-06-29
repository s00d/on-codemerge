import type { ChartPoint, ChartSeries } from './ChartTypes.ts';
import type { ChartTheme } from './ChartTheme';

export interface ChartAxisOptions {
  show?: boolean;
  title?: string;
  min?: number;
  max?: number;
  step?: number;
  gridLines?: boolean;
  tickFormat?: (value: number) => string;
}

export interface ChartLegendOptions {
  show?: boolean;
  position?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export interface ChartTooltipOptions {
  enabled?: boolean;
  format?: (value: number) => string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface ChartAnimationOptions {
  duration?: number;
  easing?: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
  delay?: number;
  loop?: boolean;
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
  subtitle?: string;
  width: number;
  height: number;
  padding?: number;
  margin?: number;
  xAxis?: ChartAxisOptions;
  yAxis?: ChartAxisOptions;
  legend?: ChartLegendOptions;
  tooltip?: ChartTooltipOptions;
  animation?: ChartAnimationOptions;
  grid?: ChartGridOptions;
  colors?: string[];
  backgroundColor?: string;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  data?: ChartPoint[] | ChartSeries[];
  theme?: ChartTheme;
  mode?: 'default' | 'stacked' | 'grouped';
  orientation?: 'vertical' | 'horizontal';
}
