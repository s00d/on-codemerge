import { h, mount } from '@on-codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import type { ChartPoint } from '../types';
import { toChartPoint } from '../utils/validation';
import { getRandomColor } from '../utils/colors';
import { DataRow } from './DataRow';

/** Chart points editor — ViewSpec + mountInto (no helpers/getElement). */
export class ChartDataEditor {
  private readonly editor: EditorAPI;
  private readonly onChange: (data: ChartPoint[]) => void;
  private readonly requiresXY: boolean;
  private readonly isScatter: boolean;
  private rows: DataRow[] = [];
  private data: ChartPoint[] = [];
  private mountHandle: MountHandle | null = null;

  constructor(
    editor: EditorAPI,
    onChange: (data: ChartPoint[]) => void,
    requiresXY = false,
    isScatter = false
  ) {
    this.editor = editor;
    this.onChange = onChange;
    this.requiresXY = requiresXY;
    this.isScatter = isScatter;
    this.addInitialRows();
  }

  private getHeaderGridCols(): string {
    if (this.requiresXY) {
      return this.isScatter
        ? 'grid-cols-[1fr,80px,80px,40px]'
        : 'grid-cols-[1fr,80px,80px,80px,40px,40px]';
    }
    return 'grid-cols-[1fr,120px,40px,40px]';
  }

  private addInitialRows(): void {
    const defaultData: Partial<ChartPoint>[] = [
      { label: 'Point 1', value: 10 },
      { label: 'Point 2', value: 20 },
      { label: 'Point 3', value: 15 },
    ];
    defaultData.forEach((data) => {
      if (this.requiresXY) {
        data.x = data.value;
        data.y = Math.random() * 30;
        if (!this.isScatter) {
          data.r = 5;
          data.color = getRandomColor();
        }
      }
      this.pushRow(data);
    });
    this.emit();
  }

  private pushRow(data: Partial<ChartPoint> = {}): void {
    const row = new DataRow(
      this.editor,
      data,
      this.requiresXY,
      this.isScatter,
      () => {
        this.emit();
      },
      () => {
        this.rows = this.rows.filter((r) => r !== row);
        this.remount();
        this.emit();
      }
    );
    this.rows.push(row);
  }

  private emit(): void {
    this.data = this.rows
      .map((r) => toChartPoint(r.getData()))
      .filter((point): point is ChartPoint => point !== null);
    this.onChange(this.data);
  }

  private remount(): void {
    if (!this.mountHandle) {
      return;
    }
    this.mountHandle.update(this.view());
  }

  view(): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    const headers: ViewSpec[] = [
      h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.label')),
    ];
    if (this.requiresXY) {
      headers.push(
        h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.x')),
        h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.y'))
      );
      if (!this.isScatter) {
        headers.push(
          h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.size')),
          h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.color'))
        );
      }
    } else {
      headers.push(
        h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.value')),
        h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.color'))
      );
    }
    headers.push(h('div', null));

    return h('div', { class: 'chart-data-editor' }, [
      h('div', { class: 'space-y-4' }, [
        h('div', { class: 'flex items-center justify-between mb-4' }, [
          h('div', { class: 'text-sm font-medium text-gray-700' }, t('common.dataPoints')),
          h(
            'button',
            {
              class:
                'add-row-btn px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600',
              attrs: { type: 'button' },
              on: {
                click: () => {
                  this.pushRow();
                  this.remount();
                  this.emit();
                },
              },
            },
            t('common.addPoint')
          ),
        ]),
        h('div', { class: 'data-grid' }, [
          h('div', { class: `grid ${this.getHeaderGridCols()} gap-2 pb-2 border-b` }, ...headers),
          h('div', { class: 'data-rows space-y-2 mt-2' }, ...this.rows.map((r) => r.view())),
        ]),
      ]),
    ]);
  }

  mountInto(host: HTMLElement): void {
    this.mountHandle?.destroy();
    this.mountHandle = mount(host, this.view());
  }

  getData(): ChartPoint[] {
    return this.data;
  }

  setData(data: ChartPoint[]): void {
    this.rows = [];
    data.forEach((point) => {
      this.pushRow(point);
    });
    this.remount();
    this.emit();
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
    this.rows = [];
    this.data = [];
  }
}
