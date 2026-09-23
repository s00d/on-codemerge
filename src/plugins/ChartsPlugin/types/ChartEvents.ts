import type { ChartOptions } from './ChartOptions';
import type { ChartPoint, ChartSeries } from './ChartTypes';

export interface ChartResizeEvent {
  type: 'resize';
  width: number;
  height: number;
}

export interface ChartUpdateEvent {
  type: 'update';
  data: ChartPoint[] | ChartSeries[];
  options: ChartOptions;
}

export interface ChartDestroyEvent {
  type: 'destroy';
}

export type ChartEventType = 'resize' | 'update' | 'destroy';

export type ChartEventHandler = (
  event: ChartResizeEvent | ChartUpdateEvent | ChartDestroyEvent
) => void;

export interface ChartEventMap {
  resize: ChartResizeEvent;
  update: ChartUpdateEvent;
  destroy: ChartDestroyEvent;
}
