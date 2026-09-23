import { h, mount } from '@on-codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@on-codemerge/sdk';
import type { ChartSeries } from '../types';
import { deleteIcon } from '../../../icons';
import { getRandomColor } from '../utils/colors';
import { colorSwatchButton } from '../../../utils/ColorWell';

type PointDraft = {
  label: string;
  value: number;
  x: number;
  y: number;
  color: string;
};

type SeriesDraft = {
  name: string;
  color: string;
  points: PointDraft[];
};

/** Multi-series chart editor — ViewSpec + mountInto. */
export class MultiSeriesDataEditor {
  private readonly editor: EditorAPI;
  private readonly onChange: (series: ChartSeries[]) => void;
  private drafts: SeriesDraft[] = [];
  private series: ChartSeries[] = [];
  private mountHandle: MountHandle | null = null;

  constructor(editor: EditorAPI, onChange: (series: ChartSeries[]) => void) {
    this.editor = editor;
    this.onChange = onChange;
    this.addInitialSeries();
  }

  private nextColor(): string {
    return getRandomColor();
  }

  private addInitialSeries(): void {
    const t = (k: string) => this.editor.t(k) || k;
    this.drafts.push({
      name: t('charts.series1'),
      color: getRandomColor(),
      points: [
        { label: t('common.jan'), value: 10, x: 1, y: 1, color: this.nextColor() },
        { label: t('common.feb'), value: 20, x: 2, y: 2, color: this.nextColor() },
        { label: t('common.mar'), value: 15, x: 3, y: 3, color: this.nextColor() },
      ],
    });
    this.emit();
  }

  private emit(): void {
    this.series = this.drafts.map((s) => ({
      name: s.name,
      color: s.color,
      data: s.points
        .filter((p) => p.label)
        .map((p) => ({
          label: `${p.label} (${p.value})`,
          value: p.value,
          r: p.value,
          x: p.x,
          y: p.y,
          color: p.color || '#3b82f6',
        })),
    }));
    this.onChange(this.series);
  }

  private remount(): void {
    if (!this.mountHandle) {
      return;
    }
    this.mountHandle.update(this.view());
  }

  private pointRow(seriesIdx: number, pointIdx: number, point: PointDraft): ViewSpec {
    const bump = (fn: () => void) => {
      fn();
      this.emit();
    };
    return h(
      'div',
      { class: 'grid grid-cols-[0.9fr,60px,60px,60px,40px,60px] gap-2 items-center' },
      h('input', {
        class: 'label-input px-2 py-1 border rounded text-sm',
        attrs: { type: 'text', placeholder: 'label' },
        props: { value: point.label },
        on: {
          input: (e) => {
            const el = e.target;
            bump(() => {
              point.label = el instanceof HTMLInputElement ? el.value : '';
            });
          },
        },
      }),
      h('input', {
        class: 'value-input px-2 py-1 border rounded text-sm',
        attrs: { type: 'number', placeholder: 'value' },
        props: { value: String(point.value) },
        on: {
          input: (e) => {
            const el = e.target;
            bump(() => {
              point.value = Number(el instanceof HTMLInputElement ? el.value : '') || 0;
            });
          },
        },
      }),
      h('input', {
        class: 'x-input px-2 py-1 border rounded text-sm',
        attrs: { type: 'number', placeholder: 'X' },
        props: { value: String(point.x) },
        on: {
          input: (e) => {
            const el = e.target;
            bump(() => {
              point.x = Number(el instanceof HTMLInputElement ? el.value : '') || 0;
            });
          },
        },
      }),
      h('input', {
        class: 'y-input px-2 py-1 border rounded text-sm',
        attrs: { type: 'number', placeholder: 'Y' },
        props: { value: String(point.y) },
        on: {
          input: (e) => {
            const el = e.target;
            bump(() => {
              point.y = Number(el instanceof HTMLInputElement ? el.value : '') || 0;
            });
          },
        },
      }),
      colorSwatchButton(
        this.editor,
        () => point.color || getRandomColor(),
        (hex) => {
          bump(() => {
            point.color = hex;
          });
        }
      ),
      h('button', {
        class: 'delete-point-btn p-1 pl-2 text-red-500 hover:text-red-700',
        attrs: { type: 'button' },
        props: { innerHTML: deleteIcon },
        on: {
          click: () => {
            this.drafts[seriesIdx].points.splice(pointIdx, 1);
            this.remount();
            this.emit();
          },
        },
      })
    );
  }

  private seriesSection(seriesIdx: number, series: SeriesDraft): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    return h('div', { class: 'series-section border rounded-lg p-4' }, [
      h('div', { class: 'flex items-center justify-between mb-4' }, [
        h('div', { class: 'flex items-center gap-3' }, [
          h('input', {
            class: 'series-name px-2 py-1 border rounded text-sm',
            attrs: { type: 'text', placeholder: t('charts.seriesName') },
            props: { value: series.name },
            on: {
              input: (e) => {
                const el = e.target;
                series.name = el instanceof HTMLInputElement ? el.value : '';
                this.emit();
              },
            },
          }),
          colorSwatchButton(
            this.editor,
            () => series.color || getRandomColor(),
            (hex) => {
              series.color = hex;
              this.emit();
            },
            { title: t('common.color') }
          ),
        ]),
        h('button', {
          class: 'delete-series-btn p-1 text-red-500 hover:text-red-700',
          attrs: { type: 'button' },
          props: { innerHTML: deleteIcon },
          on: {
            click: () => {
              this.drafts.splice(seriesIdx, 1);
              this.remount();
              this.emit();
            },
          },
        }),
      ]),
      h('div', { class: 'data-grid' }, [
        h('div', { class: 'grid grid-cols-[0.9fr,60px,60px,60px,40px,60px] gap-2 pb-2 border-b' }, [
          h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.label')),
          h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.value')),
          h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.x')),
          h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.y')),
          h('div', { class: 'text-sm font-medium text-gray-600' }, t('common.color')),
          h('div', { class: 'text-sm font-medium text-gray-600' }),
        ]),
        h(
          'div',
          { class: 'data-rows space-y-2 mt-2' },
          ...series.points.map((p, i) => this.pointRow(seriesIdx, i, p))
        ),
      ]),
      h(
        'button',
        {
          class: 'add-point-btn mt-2 px-2 py-1 text-sm text-blue-600 hover:text-blue-700',
          attrs: { type: 'button' },
          on: {
            click: () => {
              series.points.push({
                label: '',
                value: 0,
                x: 0,
                y: 0,
                color: getRandomColor(),
              });
              this.remount();
              this.emit();
            },
          },
        },
        t('common.addDataPoint')
      ),
    ]);
  }

  view(): ViewSpec {
    const t = (k: string) => this.editor.t(k) || k;
    return h('div', { class: 'chart-data-editor' }, [
      h('div', { class: 'space-y-4' }, [
        h('div', { class: 'flex justify-between items-center' }, [
          h('h4', { class: 'text-sm font-medium text-gray-700' }, t('charts.seriesData')),
          h(
            'button',
            {
              class:
                'add-series-btn px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600',
              attrs: { type: 'button' },
              on: {
                click: () => {
                  this.drafts.push({
                    name: `Series ${this.drafts.length + 1}`,
                    color: this.nextColor(),
                    points: [],
                  });
                  this.remount();
                  this.emit();
                },
              },
            },
            t('charts.addSeries')
          ),
        ]),
        h(
          'div',
          { class: 'series-container space-y-6' },
          ...this.drafts.map((s, i) => this.seriesSection(i, s))
        ),
      ]),
    ]);
  }

  mountInto(host: HTMLElement): void {
    this.mountHandle?.destroy();
    this.mountHandle = mount(host, this.view());
  }

  getData(): ChartSeries[] {
    return this.series;
  }

  setData(series: ChartSeries[]): void {
    this.drafts = (series ?? []).map((s) => ({
      name: s.name ?? '',
      color: s.color || '#3b82f6',
      points: (s.data ?? []).map((p) => {
        const rawLabel = p.label ?? '';
        const wrapped = /^(.*) \((-?\d+(?:\.\d+)?)\)$/.exec(rawLabel);
        return {
          label: wrapped?.[1] ?? rawLabel,
          value:
            (typeof p.value === 'number' ? p.value : Number(p.value)) ||
            (wrapped?.[2] === undefined ? 0 : Number(wrapped[2])) ||
            0,
          x: Number(p.x) || 0,
          y: Number(p.y) || 0,
          color: p.color || '#3b82f6',
        };
      }),
    }));
    if (this.drafts.length === 0) {
      this.addInitialSeries();
      return;
    }
    this.remount();
    this.emit();
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
    this.drafts = [];
    this.series = [];
  }
}
