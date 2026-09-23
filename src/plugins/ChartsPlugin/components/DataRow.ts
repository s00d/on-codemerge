import { h } from '@on-codemerge/sdk';
import type { EditorAPI, ViewSpec } from '@on-codemerge/sdk';
import type { ChartPoint } from '../types';
import { getRandomColor } from '../utils/colors';
import { colorSwatchButton } from '../../../utils/ColorWell';
import { deleteIcon } from '../../../icons';

/** One chart data row as ViewSpec (draft held in memory). */
export class DataRow {
  private readonly editor: EditorAPI;
  private readonly draft: Partial<ChartPoint>;
  private readonly requiresXY: boolean;
  private readonly isScatter: boolean;
  private readonly onChange: () => void;
  private readonly onDelete: () => void;

  constructor(
    editor: EditorAPI,
    data: Partial<ChartPoint>,
    requiresXY: boolean,
    isScatter: boolean,
    onChange: () => void,
    onDelete: () => void
  ) {
    this.editor = editor;
    this.requiresXY = requiresXY;
    this.isScatter = isScatter;
    this.onChange = onChange;
    this.onDelete = onDelete;
    this.draft = {
      label: data.label ?? '',
      value: data.value,
      x: data.x,
      y: data.y,
      r: data.r ?? 5,
      color: data.color ?? getRandomColor(),
    };
  }

  private getGridCols(): string {
    if (this.requiresXY) {
      return this.isScatter
        ? 'grid-cols-[1fr,80px,80px,40px]'
        : 'grid-cols-[1fr,80px,80px,80px,40px,40px]';
    }
    return 'grid-cols-[1fr,120px,40px,40px]';
  }

  private input(
    className: string,
    type: string,
    value: string,
    placeholder: string,
    onInput: (v: string) => void
  ): ViewSpec {
    return h('input', {
      class: className,
      attrs: { type, placeholder },
      props: { value },
      on: {
        input: (e) => {
          onInput((e.target as HTMLInputElement).value);
          this.onChange();
        },
      },
    });
  }

  private colorControl(): ViewSpec {
    return colorSwatchButton(
      this.editor,
      () => this.draft.color ?? getRandomColor(),
      (hex) => {
        this.draft.color = hex;
        this.onChange();
      }
    );
  }

  view(): ViewSpec {
    const d = this.draft;
    const children: ViewSpec[] = [
      this.input(
        'label-input px-2 py-1 border rounded text-sm',
        'text',
        d.label ?? '',
        'Label',
        (v) => {
          d.label = v;
        }
      ),
    ];

    if (this.requiresXY) {
      children.push(
        this.input(
          'x-input px-2 py-1 border rounded text-sm',
          'number',
          String(d.x ?? ''),
          'X',
          (v) => {
            d.x = Number(v) || 0;
          }
        ),
        this.input(
          'y-input px-2 py-1 border rounded text-sm',
          'number',
          String(d.y ?? ''),
          'Y',
          (v) => {
            d.y = Number(v) || 0;
          }
        )
      );
      if (!this.isScatter) {
        children.push(
          this.input(
            'r-input px-2 py-1 border rounded text-sm',
            'number',
            String(d.r ?? 5),
            'Size',
            (v) => {
              d.r = Number(v) || 5;
            }
          ),
          this.colorControl()
        );
      }
    } else {
      children.push(
        this.input(
          'value-input px-2 py-1 border rounded text-sm',
          'number',
          String(d.value ?? ''),
          'Value',
          (v) => {
            d.value = Number(v) || 0;
          }
        ),
        this.colorControl()
      );
    }

    children.push(
      h('button', {
        class: 'delete-row-btn p-1 text-red-500 hover:text-red-700',
        attrs: { type: 'button', title: 'Delete Point' },
        props: { innerHTML: deleteIcon },
        on: {
          click: () => {
            this.onDelete();
          },
        },
      })
    );

    return h('div', { class: `grid ${this.getGridCols()} gap-2 items-center` }, children);
  }

  getData(): Partial<ChartPoint> {
    const data: Partial<ChartPoint> = { label: this.draft.label ?? '' };
    if (this.requiresXY) {
      data.x = this.draft.x ?? 0;
      data.y = this.draft.y ?? 0;
      if (this.isScatter) {
        data.color = getRandomColor();
        data.r = 5;
      } else {
        data.r = this.draft.r ?? 5;
        data.color = this.draft.color;
      }
      data.value = data.y;
    } else {
      data.value = this.draft.value ?? 0;
      data.color = this.draft.color;
    }
    return data;
  }
}
