import { h } from '@codemerge/sdk';
import type { ViewSpec } from '@codemerge/sdk';
import type { CellValue, TableColumn } from '../../io/adapters';
import { parseTableBoolean } from '../../io/adapters';
import { stringifyCell } from '../../io/matrix';

export type CellRenderCtx = {
  value: CellValue;
  column: TableColumn;
  rowId: string;
  selected: boolean;
  editing: boolean;
  onChange: (value: CellValue) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
};

export type CellDriver = {
  key: string;
  render(ctx: CellRenderCtx): ViewSpec;
};

function textDriver(): CellDriver {
  return {
    key: 'text',
    render(ctx) {
      if (ctx.editing && ctx.column.editable !== false) {
        return h('input', {
          class:
            'h-7 w-full min-w-[4rem] rounded-ocm-sm border border-sky-500 bg-ocm-surface px-1.5 font-mono text-[13px] outline-none',
          attrs: { type: 'text', 'aria-label': `${ctx.column.title} cell`, autofocus: true },
          props: { value: stringifyCell(ctx.value) },
          on: {
            change: (ev) => {
              const t = ev.target;
              if (t instanceof HTMLInputElement) {
                ctx.onChange(t.value);
              }
            },
            blur: () => {
              ctx.onEndEdit();
            },
          },
        });
      }
      return h(
        'button',
        {
          class: `flex h-7 w-full min-w-[4rem] items-center truncate rounded-ocm-sm border px-1.5 text-left font-mono text-[13px] ${
            ctx.selected ? 'border-sky-500 bg-sky-50' : 'border-transparent hover:border-ocm-border'
          }`,
          attrs: { type: 'button' },
          on: {
            click: () => {
              ctx.onStartEdit();
            },
            dblclick: () => {
              ctx.onStartEdit();
            },
          },
        },
        stringifyCell(ctx.value)
      );
    },
  };
}

function numberDriver(): CellDriver {
  const base = textDriver();
  return {
    key: 'number',
    render(ctx) {
      if (ctx.editing && ctx.column.editable !== false) {
        return h('input', {
          class:
            'h-7 w-full min-w-[4rem] rounded-ocm-sm border border-sky-500 bg-ocm-surface px-1.5 font-mono text-[13px] outline-none tabular-nums',
          attrs: { type: 'number', 'aria-label': `${ctx.column.title} cell`, autofocus: true },
          props: { value: stringifyCell(ctx.value) },
          on: {
            change: (ev) => {
              const t = ev.target;
              if (t instanceof HTMLInputElement) {
                const n = t.valueAsNumber;
                ctx.onChange(Number.isFinite(n) ? n : t.value);
              }
            },
            blur: () => {
              ctx.onEndEdit();
            },
          },
        });
      }
      return base.render(ctx);
    },
  };
}

function booleanDriver(): CellDriver {
  return {
    key: 'boolean',
    render(ctx) {
      return h('input', {
        class: 'size-4',
        attrs: {
          type: 'checkbox',
          'aria-label': `${ctx.column.title} cell`,
          disabled: ctx.column.editable === false ? true : undefined,
        },
        props: { checked: parseTableBoolean(ctx.value) },
        on: {
          change: (ev) => {
            const t = ev.target;
            if (t instanceof HTMLInputElement) {
              ctx.onChange(t.checked);
            }
          },
        },
      });
    },
  };
}

const DRIVERS: Record<string, CellDriver> = {
  text: textDriver(),
  number: numberDriver(),
  boolean: booleanDriver(),
};

export function getCellDriver(column: TableColumn): CellDriver {
  const key = column.renderer || column.editor || column.type || 'text';
  return DRIVERS[key] ?? textDriver();
}

export function registerCellDriver(driver: CellDriver): void {
  DRIVERS[driver.key] = driver;
}
