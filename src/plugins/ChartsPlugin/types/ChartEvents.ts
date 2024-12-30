export interface ChartClickEvent {
  type: 'click';
  point: {
    x: number;
    y: number;
    dataIndex: number;
    value: number;
    label: string;
  };
}

export interface ChartHoverEvent {
  type: 'hover';
  point: {
    x: number;
    y: number;
    dataIndex: number;
    value: number;
    label: string;
  };
}

export interface ChartResizeEvent {
  type: 'resize';
  dimensions: {
    width: number;
    height: number;
    previousWidth: number;
    previousHeight: number;
  };
}

export type ChartEventType = 'click' | 'hover' | 'resize' | 'update' | 'destroy';

export type ChartEventHandler = (
  event: ChartClickEvent | ChartHoverEvent | ChartResizeEvent
) => void;

export interface ChartEventMap {
  click: ChartClickEvent;
  hover: ChartHoverEvent;
  resize: ChartResizeEvent;
}
