import { h, mount, colorSwatchButton } from '@codemerge/sdk';
import type { EditorAPI, MountHandle, ViewSpec } from '@codemerge/sdk';

import type { ChartPoint, ChartSeries, ChartType } from '../types';
import type { ChartDriver, PointField } from '../drivers/types';
import { getDriver } from '../drivers/registry';
import { getRandomColor } from '../utils/colors';

import { deleteIcon, insertIcon } from '@codemerge/sdk/icons';

type SeriesDraft = { name: string; color: string; points: ChartPoint[] };

/**
 * Single data editor driven by ChartDriver.fields / seriesMode.
 * Always getSeries()/setSeries() as ChartSeries[].
 */
export class ChartDataTable {
  private readonly editor: EditorAPI;
  private readonly onChange: (series: ChartSeries[]) => void;
  private driver: ChartDriver;
  private series: SeriesDraft[] = [];
  private mountHandle: MountHandle | null = null;
  private host: HTMLElement | null = null;

  constructor(editor: EditorAPI, type: ChartType, onChange: (series: ChartSeries[]) => void) {
    this.editor = editor;
    this.onChange = onChange;
    this.driver = getDriver(type);
    this.series = this.toDrafts(this.driver.defaults());
  }

  private t(key: string): string {
    return this.editor.t(key);
  }

  private toDrafts(series: ChartSeries[]): SeriesDraft[] {
    return series.map((s) => ({
      name: s.name,
      color: s.color || getRandomColor(),
      points: s.data.map((p) => ({ ...p })),
    }));
  }

  private emit(): void {
    this.onChange(this.getSeries());
  }

  private remount(): void {
    if (!this.host) {
      return;
    }
    this.mountHandle?.destroy();
    this.mountHandle = mount(this.host, this.view());
  }

  setType(type: ChartType, previous?: ChartSeries[]): void {
    this.driver = getDriver(type);
    const raw = previous ?? this.getSeries();
    this.series = this.toDrafts(this.driver.coerce(raw));
    this.remount();
    this.emit();
  }

  getSeries(): ChartSeries[] {
    const multi = this.driver.seriesMode === 'multi';
    const drafts = multi ? this.series : this.series.slice(0, 1);
    return drafts.map((s) => ({
      name: s.name,
      color: s.color,
      data: s.points.map((p) => this.projectPoint(p)),
    }));
  }

  setSeries(series: ChartSeries[]): void {
    this.series = this.toDrafts(this.driver.coerce(series));
    this.remount();
    this.emit();
  }

  private projectPoint(p: ChartPoint): ChartPoint {
    const out: ChartPoint = { label: p.label || '', value: p.value ?? 0 };
    for (const f of this.driver.fields) {
      if (f === 'label') {
        continue;
      }
      if (f === 'color') {
        out.color = p.color;
        continue;
      }
      const v = p[f];
      if (typeof v === 'number') {
        out[f] = v;
      }
    }
    if (this.driver.fields.includes('value') && typeof out.value !== 'number') {
      out.value = typeof p.y === 'number' ? p.y : 0;
    }
    return out;
  }

  private fieldInput(
    value: string,
    type: string,
    onInput: (v: string) => void,
    className = 'chart-series-input'
  ): ViewSpec {
    return h('input', {
      class: className,
      attrs: { type },
      props: { value },
      on: {
        input: (e) => {
          const el = e.target;
          onInput(el instanceof HTMLInputElement ? el.value : '');
          this.emit();
        },
      },
    });
  }

  private fieldHeader(f: PointField): string {
    switch (f) {
      case 'label': {
        return this.t('common.label');
      }
      case 'value': {
        return this.t('common.value');
      }
      case 'x': {
        return this.t('common.x');
      }
      case 'y': {
        return this.t('common.y');
      }
      case 'r': {
        return this.t('common.size');
      }
      case 'color': {
        return this.t('common.color');
      }
      default: {
        return f;
      }
    }
  }

  private cell(point: ChartPoint, f: PointField): ViewSpec {
    if (f === 'color') {
      return colorSwatchButton(
        this.editor,
        () => point.color ?? getRandomColor(),
        (hex) => {
          point.color = hex;
          this.emit();
        },
        { className: 'chart-series-swatch' }
      );
    }
    if (f === 'label') {
      return this.fieldInput(point.label ?? '', 'text', (v) => {
        point.label = v;
      });
    }
    const num = f === 'value' ? point.value : f === 'x' ? point.x : f === 'y' ? point.y : point.r;
    return this.fieldInput(
      String(num ?? 0),
      'number',
      (v) => {
        const n = Number(v) || 0;
        if (f === 'value') {
          point.value = n;
        } else if (f === 'x') {
          point.x = n;
        } else if (f === 'y') {
          point.y = n;
          point.value = n;
        } else {
          point.r = n;
        }
      },
      'chart-series-input chart-series-input--num'
    );
  }

  private pointRow(si: number, pi: number, point: ChartPoint): ViewSpec {
    const only = (this.series[si]?.points.length ?? 0) <= 1;
    return h(
      'div',
      {
        class: 'chart-series-point-row',
        style: {
          gridTemplateColumns: this.gridCols(),
        },
      },
      [
        ...this.driver.fields.map((f) => this.cell(point, f)),
        h('button', {
          class: 'chart-series-icon-btn chart-series-icon-btn--danger',
          attrs: {
            type: 'button',
            title: this.t('common.delete'),
            ...(only ? { disabled: 'true' } : {}),
          },
          props: { innerHTML: deleteIcon },
          on: {
            click: () => {
              if (only) {
                return;
              }
              this.series[si]?.points.splice(pi, 1);
              this.remount();
              this.emit();
            },
          },
        }),
      ]
    );
  }

  private gridCols(): string {
    const cols: string[] = this.driver.fields.map((f) =>
      f === 'label' ? 'minmax(0,1.4fr)' : f === 'color' ? '2.5rem' : 'minmax(4.5rem,0.7fr)'
    );
    cols.push('2.25rem');
    return cols.join(' ');
  }

  private seriesCard(draft: SeriesDraft, si: number): ViewSpec {
    const multi = this.driver.seriesMode === 'multi';
    return h('article', { class: 'chart-series-card' }, [
      multi
        ? h('header', { class: 'chart-series-card__head' }, [
            h('span', { class: 'chart-series-card__badge' }, String(si + 1)),
            this.fieldInput(
              draft.name,
              'text',
              (v) => {
                draft.name = v;
              },
              'chart-series-input chart-series-input--name'
            ),
            colorSwatchButton(
              this.editor,
              () => draft.color,
              (hex) => {
                draft.color = hex;
                this.emit();
              },
              { className: 'chart-series-swatch chart-series-swatch--lg' }
            ),
            h('button', {
              class: 'chart-series-icon-btn chart-series-icon-btn--danger',
              attrs: {
                type: 'button',
                title: this.t('common.delete'),
                ...(this.series.length <= 1 ? { disabled: 'true' } : {}),
              },
              props: { innerHTML: deleteIcon },
              on: {
                click: () => {
                  if (this.series.length <= 1) {
                    return;
                  }
                  this.series.splice(si, 1);
                  this.remount();
                  this.emit();
                },
              },
            }),
          ])
        : h('div', { class: 'chart-series-editor__title' }, this.t('charts.dataPoints')),
      h('div', { class: 'chart-series-points' }, [
        h(
          'div',
          {
            class: 'chart-series-point-head',
            style: { gridTemplateColumns: this.gridCols() },
          },
          [
            ...this.driver.fields.map((f) => h('span', {}, this.fieldHeader(f))),
            h('span', { attrs: { 'aria-hidden': 'true' } }, ''),
          ]
        ),
        ...draft.points.map((p, pi) => this.pointRow(si, pi, p)),
      ]),
      h(
        'button',
        {
          class: 'chart-series-add-point',
          attrs: { type: 'button' },
          on: {
            click: () => {
              const blank: ChartPoint = { label: '', value: 0, color: getRandomColor() };
              if (this.driver.fields.includes('x')) {
                blank.x = 0;
              }
              if (this.driver.fields.includes('y')) {
                blank.y = 0;
              }
              if (this.driver.fields.includes('r')) {
                blank.r = 8;
              }
              draft.points.push(blank);
              this.remount();
              this.emit();
            },
          },
        },
        [
          h('span', { class: 'chart-series-add-point__icon', props: { innerHTML: insertIcon } }),
          this.t('charts.addPoint'),
        ]
      ),
    ]);
  }

  view(): ViewSpec {
    const multi = this.driver.seriesMode === 'multi';
    return h('div', { class: 'chart-series-editor' }, [
      h('div', { class: 'chart-series-editor__toolbar' }, [
        h(
          'div',
          { class: 'chart-series-editor__title' },
          multi ? this.t('charts.seriesData') : this.t('charts.dataPoints')
        ),
        multi
          ? h(
              'button',
              {
                class: 'chart-series-add-series',
                attrs: { type: 'button' },
                on: {
                  click: () => {
                    const n = this.series.length + 1;
                    this.series.push({
                      name: `${this.t('charts.series')} ${n}`,
                      color: getRandomColor(),
                      points: [
                        { label: 'A', value: 10, color: getRandomColor() },
                        { label: 'B', value: 20, color: getRandomColor() },
                      ],
                    });
                    this.remount();
                    this.emit();
                  },
                },
              },
              [
                h('span', {
                  class: 'chart-series-add-series__icon',
                  props: { innerHTML: insertIcon },
                }),
                this.t('charts.addSeries'),
              ]
            )
          : null,
      ]),
      h(
        'div',
        { class: 'chart-series-list' },
        this.series.map((s, i) => this.seriesCard(s, i))
      ),
    ]);
  }

  mountInto(host: HTMLElement): void {
    this.host = host;
    this.mountHandle?.destroy();
    this.mountHandle = mount(host, this.view());
  }

  destroy(): void {
    this.mountHandle?.destroy();
    this.mountHandle = null;
    this.host = null;
    this.series = [];
  }
}
